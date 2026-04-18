import unittest
from asyncio import run

from fastapi import HTTPException

from app.api.routes import compile_graph, validate_graph
from app.api.schemas import GraphRequest
from app.main import app


VALID_GRAPH = {
    "nodes": [
        {"id": "input_image", "type": "Input", "name": "image", "params": {"shape": [1, 3, 32, 32]}},
        {
            "id": "conv-1",
            "type": "Conv2d",
            "params": {"in_channels": 3, "out_channels": 8, "kernel_size": 3, "stride": 1, "padding": 1},
        },
        {"id": "relu 1", "type": "ReLU", "params": {}},
        {"id": "output_main", "type": "Output", "name": "main", "params": {}},
    ],
    "edges": [
        {"source": "input_image", "target": "conv-1"},
        {"source": "conv-1", "target": "relu 1"},
        {"source": "relu 1", "target": "output_main"},
    ],
}

MULTI_IO_GRAPH = {
    "nodes": [
        {"id": "input_image", "type": "Input", "name": "image", "params": {"shape": [1, 3, 32, 32]}},
        {"id": "input_aux", "type": "Input", "name": "aux", "params": {"shape": [1, 3, 32, 32]}},
        {"id": "merge", "type": "Add", "params": {}},
        {"id": "output_main", "type": "Output", "name": "main", "params": {}},
        {"id": "output_skip", "type": "Output", "name": "skip", "params": {}},
    ],
    "edges": [
        {"source": "input_image", "target": "merge"},
        {"source": "input_aux", "target": "merge"},
        {"source": "merge", "target": "output_main"},
        {"source": "input_aux", "target": "output_skip"},
    ],
}


class CompilerApiTests(unittest.TestCase):
    def test_options_preflight_is_allowed_for_compile(self) -> None:
        status_code, headers, _ = run(
            asgi_request(
                app,
                method="OPTIONS",
                path="/compile",
                headers={
                    "origin": "http://127.0.0.1:3000",
                    "access-control-request-method": "POST",
                },
            )
        )

        self.assertEqual(status_code, 200)
        self.assertEqual(headers.get("access-control-allow-origin"), "*")
        self.assertIn("POST", headers.get("access-control-allow-methods", ""))

    def test_validate_returns_topological_order_and_shapes(self) -> None:
        response = validate_graph(GraphRequest.model_validate(VALID_GRAPH))

        payload = response.model_dump()
        self.assertTrue(payload["valid"])
        self.assertEqual(payload["topological_order"], ["input_image", "conv-1", "relu 1", "output_main"])
        self.assertEqual(payload["shapes"]["input_image"], [1, 3, 32, 32])
        self.assertEqual(payload["shapes"]["conv-1"], [1, 8, 32, 32])
        self.assertEqual(payload["shapes"]["output_main"], [1, 8, 32, 32])

    def test_compile_returns_code_with_named_input_and_output_dict(self) -> None:
        response = compile_graph(GraphRequest.model_validate(VALID_GRAPH))

        payload = response.model_dump()
        code = payload["code"]
        self.assertIn("def forward(self, image):", code)
        self.assertIn("t_conv_1 = self.conv_1(image)", code)
        self.assertIn('return {"main": t_relu_1}', code)
        self.assertEqual(payload["shapes"]["relu 1"], [1, 8, 32, 32])

    def test_compile_supports_multiple_named_inputs_and_outputs(self) -> None:
        response = compile_graph(GraphRequest.model_validate(MULTI_IO_GRAPH))

        payload = response.model_dump()
        code = payload["code"]
        self.assertIn("def forward(self, image, aux):", code)
        self.assertIn("t_merge = image + aux", code)
        self.assertIn('return {"main": t_merge, "skip": aux}', code)
        self.assertEqual(payload["shapes"]["merge"], [1, 3, 32, 32])

    def test_validate_rejects_reserved_input_name(self) -> None:
        invalid_graph = {
            "nodes": [
                {"id": "input_1", "type": "Input", "name": "class", "params": {"shape": [1, 3, 32, 32]}},
                {"id": "output_1", "type": "Output", "name": "main", "params": {}},
            ],
            "edges": [{"source": "input_1", "target": "output_1"}],
        }

        with self.assertRaises(HTTPException) as context:
            validate_graph(GraphRequest.model_validate(invalid_graph))

        self.assertEqual(context.exception.status_code, 400)
        self.assertIn("reserved keyword", context.exception.detail)

    def test_validate_requires_output_to_have_exactly_one_input(self) -> None:
        invalid_graph = {
            "nodes": [
                {"id": "input_a", "type": "Input", "name": "image", "params": {"shape": [1, 3, 32, 32]}},
                {"id": "input_b", "type": "Input", "name": "aux", "params": {"shape": [1, 3, 32, 32]}},
                {"id": "output_1", "type": "Output", "name": "main", "params": {}},
            ],
            "edges": [
                {"source": "input_a", "target": "output_1"},
                {"source": "input_b", "target": "output_1"},
            ],
        }

        with self.assertRaises(HTTPException) as context:
            validate_graph(GraphRequest.model_validate(invalid_graph))

        self.assertEqual(context.exception.status_code, 400)
        self.assertIn("must have exactly 1 incoming edge", context.exception.detail)

    def test_validate_rejects_name_on_non_input_output_nodes(self) -> None:
        invalid_graph = {
            "nodes": [
                {"id": "input_1", "type": "Input", "name": "image", "params": {"shape": [1, 3, 32, 32]}},
                {"id": "relu_1", "type": "ReLU", "name": "hidden", "params": {}},
                {"id": "output_1", "type": "Output", "name": "main", "params": {}},
            ],
            "edges": [
                {"source": "input_1", "target": "relu_1"},
                {"source": "relu_1", "target": "output_1"},
            ],
        }

        with self.assertRaises(HTTPException) as context:
            validate_graph(GraphRequest.model_validate(invalid_graph))

        self.assertEqual(context.exception.status_code, 400)
        self.assertIn("must not define a name", context.exception.detail)

    def test_validate_reports_expected_and_actual_shapes_for_add_mismatch(self) -> None:
        invalid_graph = {
            "nodes": [
                {"id": "input_image", "type": "Input", "name": "image", "params": {"shape": [1, 3, 32, 32]}},
                {"id": "input_aux", "type": "Input", "name": "aux", "params": {"shape": [1, 8, 32, 32]}},
                {"id": "add_1", "type": "Add", "params": {}},
                {"id": "output_1", "type": "Output", "name": "main", "params": {}},
            ],
            "edges": [
                {"source": "input_image", "target": "add_1"},
                {"source": "input_aux", "target": "add_1"},
                {"source": "add_1", "target": "output_1"},
            ],
        }

        with self.assertRaises(HTTPException) as context:
            validate_graph(GraphRequest.model_validate(invalid_graph))

        self.assertEqual(context.exception.status_code, 400)
        self.assertIn("Expected shape", context.exception.detail)
        self.assertIn("Actual shape", context.exception.detail)


if __name__ == "__main__":
    unittest.main()


async def asgi_request(app, method, path, headers=None, body=b""):
    response_status = None
    response_headers = []
    response_body = bytearray()

    scope = {
        "type": "http",
        "asgi": {"version": "3.0"},
        "http_version": "1.1",
        "method": method,
        "scheme": "http",
        "path": path,
        "raw_path": path.encode("ascii"),
        "query_string": b"",
        "headers": [(key.lower().encode("ascii"), value.encode("ascii")) for key, value in (headers or {}).items()],
        "client": ("127.0.0.1", 3000),
        "server": ("127.0.0.1", 8000),
    }

    has_sent_body = False

    async def receive():
        nonlocal has_sent_body
        if has_sent_body:
            return {"type": "http.disconnect"}
        has_sent_body = True
        return {"type": "http.request", "body": body, "more_body": False}

    async def send(message):
        nonlocal response_status, response_headers
        if message["type"] == "http.response.start":
            response_status = message["status"]
            response_headers = [(key.decode("ascii"), value.decode("ascii")) for key, value in message["headers"]]
        elif message["type"] == "http.response.body":
            response_body.extend(message.get("body", b""))

    await app(scope, receive, send)
    return response_status, dict(response_headers), bytes(response_body)
