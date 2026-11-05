import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))
from app.services.preprocessing import preprocess_text

def test_preprocess_lowercasing():
    assert "hello" in preprocess_text("HELLO WORLD")

def test_preprocess_urls():
    result = preprocess_text("Visit http://example.com for prizes!")
    assert "httpurl" in result

def test_preprocess_currency():
    result = preprocess_text("Win $1000 cash prize!")
    assert "currencysym" in result
    assert "winner" in result or "win" in result

def test_preprocess_empty():
    assert preprocess_text("") == ""
    assert preprocess_text(None) == ""
