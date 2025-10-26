# Optional: Add utility functions here if needed (e.g., data validation)
def validate_input(data, expected_length):
    if len(data) != expected_length:
        raise ValueError(f"Expected {expected_length} features, got {len(data)}")