"""Optional consumer check: uv run --no-project --with mlcroissant==1.1.1 python benchmarks/validate_croissant.py."""
from pathlib import Path
import mlcroissant as mlc
metadata=Path(__file__).with_name("croissant.json")
dataset=mlc.Dataset(jsonld=str(metadata))
assert len(dataset.metadata.record_sets)==2
print("Croissant 1.1.1 parsed two record sets")
