import json
import re
import sys
from pathlib import Path

import numpy
from model2vec import StaticModel

MODEL_NAME = 'minishlab/potion-base-8M'
DATA = Path('packages/core/data')


def split_identifier(text):
    return re.sub(r'([a-z0-9])([A-Z])', r'\1 \2', text)


def entry_text(entry):
    parts = [entry['name'], split_identifier(entry['slug']), entry['description']]
    if entry.get('integration'):
        parts.append(entry['integration']['name'])
    parts.extend(field.get('title') or split_identifier(field['name']) for field in entry['inputs'])
    return '. '.join(part for part in parts if part)


def quantize(matrix):
    scales = numpy.abs(matrix).max(axis=1)
    scales[scales == 0] = 1
    quantized = numpy.round(matrix / scales[:, None] * 127).astype(numpy.int8)
    return quantized, (scales / 127).astype(numpy.float32)


model = StaticModel.from_pretrained(MODEL_NAME)
catalog = json.loads((DATA / 'catalog.json').read_text())

tokenizer = json.loads(model.tokenizer.to_str())
vocabulary = sorted(tokenizer['model']['vocab'].items(), key=lambda item: item[1])
(DATA / 'vocabulary.txt').write_text('\n'.join(token for token, _ in vocabulary) + '\n')

token_vectors, token_scales = quantize(numpy.asarray(model.embedding, dtype=numpy.float32))
(DATA / 'tokens.bin').write_bytes(token_vectors.tobytes())
(DATA / 'token-scales.bin').write_bytes(token_scales.tobytes())

entry_vectors = model.encode([entry_text(entry) for entry in catalog['entries']])
entry_vectors = entry_vectors / numpy.linalg.norm(entry_vectors, axis=1, keepdims=True)
quantized_entries, entry_scales = quantize(entry_vectors.astype(numpy.float32))
(DATA / 'entries.bin').write_bytes(quantized_entries.tobytes())
(DATA / 'entry-scales.bin').write_bytes(entry_scales.tobytes())

(DATA / 'model.json').write_text(json.dumps({
    'model': MODEL_NAME,
    'dimensions': int(token_vectors.shape[1]),
    'vocabularySize': int(token_vectors.shape[0]),
    'entries': len(catalog['entries'])
}) + '\n')

samples = sys.argv[1:] or ['sync accounts to hubspot', 'Find a work email from a LinkedIn URL']
for sample in samples:
    vector = model.encode([sample])[0]
    print(json.dumps({'text': sample, 'head': [round(float(value), 4) for value in vector[:4]]}))
