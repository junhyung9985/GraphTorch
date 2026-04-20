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

EXTENDED_NODE_GRAPH = {
    "nodes": [
        {"id": "input_image", "type": "Input", "name": "image", "params": {"shape": [1, 64, 56, 56]}},
        {"id": "norm_1", "type": "LocalResponseNorm", "params": {"size": 5, "alpha": 0.0001, "beta": 0.75, "k": 1}},
        {"id": "dropout_1", "type": "Dropout", "params": {"p": 0.5}},
        {"id": "identity_1", "type": "Identity", "params": {}},
        {"id": "pool_1", "type": "AdaptiveAvgPool2d", "params": {"output_size": [1, 1]}},
        {"id": "flatten_1", "type": "Flatten", "params": {"start_dim": 1}},
        {"id": "layernorm_1", "type": "LayerNorm", "params": {"normalized_shape": [64]}},
        {"id": "softmax_1", "type": "Softmax", "params": {"dim": 1}},
        {"id": "output_main", "type": "Output", "name": "main", "params": {}},
    ],
    "edges": [
        {"source": "input_image", "target": "norm_1"},
        {"source": "norm_1", "target": "dropout_1"},
        {"source": "dropout_1", "target": "identity_1"},
        {"source": "identity_1", "target": "pool_1"},
        {"source": "pool_1", "target": "flatten_1"},
        {"source": "flatten_1", "target": "layernorm_1"},
        {"source": "layernorm_1", "target": "softmax_1"},
        {"source": "softmax_1", "target": "output_main"},
    ],
}

SEQUENCE_GRAPH = {
    "nodes": [
        {"id": "input_seq", "type": "Input", "name": "tokens", "params": {"shape": [4, 12, 128]}},
        {
            "id": "lstm_1",
            "type": "LSTM",
            "params": {"input_size": 128, "hidden_size": 256, "num_layers": 2, "batch_first": 1, "bidirectional": 1},
        },
        {
            "id": "gru_1",
            "type": "GRU",
            "params": {"input_size": 512, "hidden_size": 128, "num_layers": 1, "batch_first": 1, "bidirectional": 0},
        },
        {"id": "output_main", "type": "Output", "name": "main", "params": {}},
    ],
    "edges": [
        {"source": "input_seq", "target": "lstm_1"},
        {"source": "lstm_1", "target": "gru_1"},
        {"source": "gru_1", "target": "output_main"},
    ],
}

STACKED_LSTM_PRESET_GRAPH = {
    "nodes": [
        {"id": "input_seq", "type": "Input", "name": "tokens", "params": {"shape": [4, 20, 128]}},
        {
            "id": "lstm_1",
            "type": "LSTM",
            "params": {"input_size": 128, "hidden_size": 256, "num_layers": 3, "batch_first": 1, "bidirectional": 0},
        },
        {"id": "layernorm_1", "type": "LayerNorm", "params": {"normalized_shape": [256]}},
        {"id": "output_main", "type": "Output", "name": "main", "params": {}},
    ],
    "edges": [
        {"source": "input_seq", "target": "lstm_1"},
        {"source": "lstm_1", "target": "layernorm_1"},
        {"source": "layernorm_1", "target": "output_main"},
    ],
}

SEQ2SEQ_LSTM_PRESET_GRAPH = {
    "nodes": [
        {"id": "source_seq", "type": "Input", "name": "source", "params": {"shape": [4, 20, 128]}},
        {"id": "target_seq", "type": "Input", "name": "target", "params": {"shape": [4, 20, 128]}},
        {
            "id": "encoder_lstm",
            "type": "LSTM",
            "params": {"input_size": 128, "hidden_size": 128, "num_layers": 2, "batch_first": 1, "bidirectional": 1},
        },
        {"id": "merge_context", "type": "Concat", "params": {"dim": 2}},
        {
            "id": "decoder_lstm",
            "type": "LSTM",
            "params": {"input_size": 384, "hidden_size": 256, "num_layers": 1, "batch_first": 1, "bidirectional": 0},
        },
        {"id": "layernorm_1", "type": "LayerNorm", "params": {"normalized_shape": [256]}},
        {"id": "output_main", "type": "Output", "name": "main", "params": {}},
    ],
    "edges": [
        {"source": "source_seq", "target": "encoder_lstm"},
        {"source": "encoder_lstm", "target": "merge_context"},
        {"source": "target_seq", "target": "merge_context"},
        {"source": "merge_context", "target": "decoder_lstm"},
        {"source": "decoder_lstm", "target": "layernorm_1"},
        {"source": "layernorm_1", "target": "output_main"},
    ],
}

ENCODER_DECODER_GRU_PRESET_GRAPH = {
    "nodes": [
        {"id": "source_seq", "type": "Input", "name": "source", "params": {"shape": [4, 20, 128]}},
        {"id": "target_seq", "type": "Input", "name": "target", "params": {"shape": [4, 20, 128]}},
        {
            "id": "encoder_gru",
            "type": "GRU",
            "params": {"input_size": 128, "hidden_size": 128, "num_layers": 2, "batch_first": 1, "bidirectional": 1},
        },
        {"id": "merge_context", "type": "Concat", "params": {"dim": 2}},
        {
            "id": "decoder_gru",
            "type": "GRU",
            "params": {"input_size": 384, "hidden_size": 128, "num_layers": 1, "batch_first": 1, "bidirectional": 0},
        },
        {"id": "layernorm_1", "type": "LayerNorm", "params": {"normalized_shape": [128]}},
        {"id": "output_main", "type": "Output", "name": "main", "params": {}},
    ],
    "edges": [
        {"source": "source_seq", "target": "encoder_gru"},
        {"source": "encoder_gru", "target": "merge_context"},
        {"source": "target_seq", "target": "merge_context"},
        {"source": "merge_context", "target": "decoder_gru"},
        {"source": "decoder_gru", "target": "layernorm_1"},
        {"source": "layernorm_1", "target": "output_main"},
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

    def test_compile_supports_extended_module_and_function_nodes(self) -> None:
        response = compile_graph(GraphRequest.model_validate(EXTENDED_NODE_GRAPH))

        payload = response.model_dump()
        code = payload["code"]
        self.assertIn("self.norm_1 = nn.LocalResponseNorm(size=5, alpha=0.0001, beta=0.75, k=1)", code)
        self.assertIn("self.dropout_1 = nn.Dropout(p=0.5)", code)
        self.assertIn("self.identity_1 = nn.Identity()", code)
        self.assertIn("self.pool_1 = nn.AdaptiveAvgPool2d(output_size=[1, 1])", code)
        self.assertIn("self.layernorm_1 = nn.LayerNorm(normalized_shape=[64])", code)
        self.assertIn("t_softmax_1 = torch.softmax(t_layernorm_1, dim=1)", code)
        self.assertEqual(payload["shapes"]["norm_1"], [1, 64, 56, 56])
        self.assertEqual(payload["shapes"]["pool_1"], [1, 64, 1, 1])
        self.assertEqual(payload["shapes"]["layernorm_1"], [1, 64])
        self.assertEqual(payload["shapes"]["softmax_1"], [1, 64])

    def test_validate_requires_softmax_dim(self) -> None:
        invalid_graph = {
            "nodes": [
                {"id": "input_1", "type": "Input", "name": "image", "params": {"shape": [1, 10]}},
                {"id": "softmax_1", "type": "Softmax", "params": {}},
                {"id": "output_1", "type": "Output", "name": "main", "params": {}},
            ],
            "edges": [
                {"source": "input_1", "target": "softmax_1"},
                {"source": "softmax_1", "target": "output_1"},
            ],
        }

        with self.assertRaises(HTTPException) as context:
            validate_graph(GraphRequest.model_validate(invalid_graph))

        self.assertEqual(context.exception.status_code, 400)
        self.assertIn("dim", context.exception.detail)

    def test_validate_requires_layernorm_shape(self) -> None:
        invalid_graph = {
            "nodes": [
                {"id": "input_1", "type": "Input", "name": "image", "params": {"shape": [1, 64]}},
                {"id": "layernorm_1", "type": "LayerNorm", "params": {}},
                {"id": "output_1", "type": "Output", "name": "main", "params": {}},
            ],
            "edges": [
                {"source": "input_1", "target": "layernorm_1"},
                {"source": "layernorm_1", "target": "output_1"},
            ],
        }

        with self.assertRaises(HTTPException) as context:
            validate_graph(GraphRequest.model_validate(invalid_graph))

        self.assertEqual(context.exception.status_code, 400)
        self.assertIn("normalized_shape", context.exception.detail)

    def test_compile_supports_sequence_nodes(self) -> None:
        response = compile_graph(GraphRequest.model_validate(SEQUENCE_GRAPH))

        payload = response.model_dump()
        code = payload["code"]
        self.assertIn("self.lstm_1 = nn.LSTM(input_size=128, hidden_size=256, num_layers=2, batch_first=True, bidirectional=True)", code)
        self.assertIn("self.gru_1 = nn.GRU(input_size=512, hidden_size=128, num_layers=1, batch_first=True, bidirectional=False)", code)
        self.assertIn("t_lstm_1 = self.lstm_1(tokens)[0]", code)
        self.assertIn("t_gru_1 = self.gru_1(t_lstm_1)[0]", code)
        self.assertEqual(payload["shapes"]["lstm_1"], [4, 12, 512])
        self.assertEqual(payload["shapes"]["gru_1"], [4, 12, 128])

    def test_validate_rejects_lstm_input_size_mismatch(self) -> None:
        invalid_graph = {
            "nodes": [
                {"id": "input_seq", "type": "Input", "name": "tokens", "params": {"shape": [4, 12, 64]}},
                {"id": "lstm_1", "type": "LSTM", "params": {"input_size": 128, "hidden_size": 256, "num_layers": 1, "batch_first": 1, "bidirectional": 0}},
                {"id": "output_1", "type": "Output", "name": "main", "params": {}},
            ],
            "edges": [
                {"source": "input_seq", "target": "lstm_1"},
                {"source": "lstm_1", "target": "output_1"},
            ],
        }

        with self.assertRaises(HTTPException) as context:
            validate_graph(GraphRequest.model_validate(invalid_graph))

        self.assertEqual(context.exception.status_code, 400)
        self.assertIn("input_size", context.exception.detail)

    def test_compile_smoke_for_sequence_presets(self) -> None:
        for graph in [STACKED_LSTM_PRESET_GRAPH, SEQ2SEQ_LSTM_PRESET_GRAPH, ENCODER_DECODER_GRU_PRESET_GRAPH]:
            response = compile_graph(GraphRequest.model_validate(graph))
            payload = response.model_dump()

            self.assertTrue(payload["topological_order"])
            self.assertTrue(payload["shapes"])
            self.assertIn("class GeneratedModel", payload["code"])


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
