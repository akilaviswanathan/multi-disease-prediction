// frontend/src/App.js
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Form, Button, Card, Alert, ToggleButton, ButtonGroup } from 'react-bootstrap';

function App() {
  const [mode, setMode] = useState('single');  // NEW: 'single' or 'multi'
  const [selectedDisease, setSelectedDisease] = useState('');
  const [formData, setFormData] = useState({});
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);

  const diseases = [
    'Diabetes',
    'Heart Disease',
    'Hypertension',
    'Kidney Disease',
    'Liver Disease'
  ];

  const featureMap = {
    'Diabetes': [
      { name: 'Pregnancies', type: 'number' },
      { name: 'Glucose', type: 'number' },
      { name: 'BloodPressure', type: 'number' },
      { name: 'SkinThickness', type: 'number' },
      { name: 'Insulin', type: 'number' },
      { name: 'BMI', type: 'number' },
      { name: 'DiabetesPedigreeFunction', type: 'number' },
      { name: 'Age', type: 'number' }
    ],
    'Heart Disease': [
      { name: 'Age', type: 'number' },
      { name: 'Sex (0: Female, 1: Male)', type: 'number' },
      { name: 'RestingBP', type: 'number' },
      { name: 'Cholesterol', type: 'number' },
      { name: 'FastingBS', type: 'number' },
      { name: 'RestingECG', type: 'number' },
      { name: 'MaxHR', type: 'number' },
      { name: 'ExerciseAngina', type: 'number' },
      { name: 'Oldpeak', type: 'number' },
      { name: 'ST_Slope', type: 'number' }
    ],
    'Hypertension': [
      { name: 'Age', type: 'number' },
      { name: 'Salt_Intake', type: 'number' },
      { name: 'Stress_Score', type: 'number' },
      { name: 'BP_History', type: 'number' },
      { name: 'Sleep_Duration', type: 'number' },
      { name: 'BMI', type: 'number' },
      { name: 'Medication', type: 'number' },
      { name: 'Family_History', type: 'number' },
      { name: 'Exercise_Level', type: 'number' },
      { name: 'Smoking_Status', type: 'number' }
    ],
    'Kidney Disease': [
      { name: 'Age', type: 'number' },
      { name: 'BP', type: 'number' },
      { name: 'SG', type: 'number' },
      { name: 'AL', type: 'number' },
      { name: 'SU', type: 'number' },
      { name: 'BGR', type: 'number' },
      { name: 'BU', type: 'number' },
      { name: 'SC', type: 'number' },
      { name: 'SOD', type: 'number' },
      { name: 'POT', type: 'number' },
      { name: 'HEMO', type: 'number' },
      { name: 'PCV', type: 'number' },
      { name: 'WC', type: 'number' },
      { name: 'RC', type: 'number' },
      { name: 'HTN', type: 'number' },
      { name: 'DM', type: 'number' }
    ],
    'Liver Disease': [
      { name: 'Age', type: 'number' },
      { name: 'Gender', type: 'number' },
      { name: 'BMI', type: 'number' },
      { name: 'AlcoholConsumption', type: 'number' },
      { name: 'Smoking', type: 'number' },
      { name: 'GeneticRisk', type: 'number' },
      { name: 'PhysicalActivity', type: 'number' },
      { name: 'Diabetes', type: 'number' },
      { name: 'Hypertension', type: 'number' },
      { name: 'LiverFunctionTest', type: 'number' }
    ]
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const numValue = value === '' ? '' : (parseFloat(value) || 0);
    setFormData({ ...formData, [name]: numValue });
  };

  const handleClear = () => {
    setFormData({});
    setPrediction(null);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setPrediction(null);

    if (mode === 'single') {
      if (!selectedDisease) {
        setError('Please select a disease.');
        return;
      }
      const dataArray = featureMap[selectedDisease].map(feature => 
        formData[feature.name] === '' || isNaN(formData[feature.name]) ? 0 : formData[feature.name]
      );
      try {
        const response = await fetch('https://multi-disease-prediction-soaq.onrender.com/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ disease: selectedDisease, data: dataArray })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        setPrediction(result);
      } catch (err) {
        setError(`Prediction failed: ${err.message}`);
      }
    } else {  // Multi mode
      const multiData = {};
      diseases.forEach(disease => {
        const dataArray = featureMap[disease].map(feature => 
          formData[`${disease}-${feature.name}`] === '' || isNaN(formData[`${disease}-${feature.name}`]) ? 0 : formData[`${disease}-${feature.name}`]
        );
        multiData[disease] = dataArray;
      });
      try {
        const response = await fetch('https://multi-disease-prediction-soaq.onrender.com/multi-predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: multiData })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const { results } = await response.json();
        setPrediction(results);
      } catch (err) {
        setError(`Multi-prediction failed: ${err.message}`);
      }
    }
  };

  const getVariant = (result) => {
    if (result === 1) return 'danger';
    if (result === 0) return 'success';
    return 'warning';
  };

  // Helper to safely format confidence or raw_prob
  const safeFormat = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'N/A';
    }
    return `${value.toFixed(2)}%`;
  };

  const safeRawProb = (rawProb) => {
    if (rawProb === undefined || rawProb === null || isNaN(rawProb)) {
      return 'N/A';
    }
    return safeFormat(rawProb * 100);
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col xs={12} md={8} lg={6}>
          <Card className="shadow rounded">
            <Card.Body>
              <Card.Title className="text-center mb-4">Multi-Disease Predictor</Card.Title>
              <ButtonGroup className="mb-3 w-100">
                <ToggleButton
                  key="single"
                  id="single-mode"
                  type="radio"
                  variant="outline-primary"
                  checked={mode === 'single'}
                  onChange={(e) => setMode(e.currentTarget.value)}
                  value="single"
                >
                  Single Disease
                </ToggleButton>
                <ToggleButton
                  key="multi"
                  id="multi-mode"
                  type="radio"
                  variant="outline-primary"
                  checked={mode === 'multi'}
                  onChange={(e) => setMode(e.currentTarget.value)}
                  value="multi"
                >
                  Multi-Screen (All Diseases)
                </ToggleButton>
              </ButtonGroup>
              <Form onSubmit={handleSubmit}>
                {mode === 'single' ? (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Label>Select Disease</Form.Label>
                      <Form.Select
                        value={selectedDisease}
                        onChange={(e) => setSelectedDisease(e.target.value)}
                      >
                        <option value="">Choose a disease...</option>
                        {diseases.map((disease) => (
                          <option key={disease} value={disease}>
                            {disease}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>

                    {selectedDisease && (
                      <>
                        <h5 className="mb-3">Enter Details for {selectedDisease}</h5>
                        <Row>
                          {featureMap[selectedDisease].map((feature) => (
                            <Col xs={12} md={6} key={feature.name} className="mb-3">
                              <Form.Group controlId={feature.name}>
                                <Form.Label>{feature.name}</Form.Label>
                                <Form.Control
                                  type={feature.type}
                                  name={feature.name}
                                  value={formData[feature.name] !== undefined ? formData[feature.name] : ''}
                                  onChange={handleInputChange}
                                  placeholder={`Enter ${feature.name}`}
                                  required
                                  className="rounded"
                                  step="any"
                                  min="0"
                                />
                              </Form.Group>
                            </Col>
                          ))}
                        </Row>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <h5 className="mb-3">Enter Details for All Diseases</h5>
                    {diseases.map((disease) => (
                      <div key={disease} className="mb-4 p-3 border rounded">
                        <h6 className="mb-3">{disease}</h6>
                        <Row>
                          {featureMap[disease].map((feature) => (
                            <Col xs={12} md={6} key={feature.name} className="mb-2">
                              <Form.Group controlId={`${disease}-${feature.name}`}>
                                <Form.Label>{feature.name}</Form.Label>
                                <Form.Control
                                  type={feature.type}
                                  name={`${disease}-${feature.name}`}
                                  value={formData[`${disease}-${feature.name}`] !== undefined ? formData[`${disease}-${feature.name}`] : ''}
                                  onChange={handleInputChange}
                                  placeholder={`Enter ${feature.name} for ${disease}`}
                                  className="rounded"
                                  step="any"
                                  min="0"
                                />
                              </Form.Group>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    ))}
                  </>
                )}
                <div className="d-flex gap-2 mt-3">
                  <Button
                    variant="primary"
                    type="submit"
                    className="flex-grow-1 rounded"
                  >
                    {mode === 'single' ? 'Predict' : 'Screen All'}
                  </Button>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={handleClear}
                    className="rounded"
                  >
                    Clear
                  </Button>
                </div>
              </Form>

              {error && <Alert variant="danger" className="mt-3">{error}</Alert>}

              {prediction && (
                <>
                  {mode === 'single' ? (
                    <Alert variant={getVariant(prediction.result)} className="mt-3">
                      <strong>Prediction:</strong> {prediction.message}<br />
                      <strong>Confidence:</strong> {safeFormat(prediction.confidence)}<br />
                      <small>Raw Prob (Has): {safeRawProb(prediction.raw_prob)}</small>
                    </Alert>
                  ) : (
                    <div className="mt-3">
                      <h5>Screening Results (Ranked by Risk)</h5>
                      {Object.entries(prediction).map(([disease, res]) => (
                        <Alert key={disease} variant={getVariant(res.result)} className="mb-2">
                          <strong>{disease}:</strong> {res.message}<br />
                          <strong>Confidence:</strong> {safeFormat(res.confidence)}<br />
                          <small>Raw Prob (Has): {safeRawProb(res.raw_prob)}</small>
                        </Alert>
                      ))}
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default App;
