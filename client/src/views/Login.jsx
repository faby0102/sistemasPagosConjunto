import React, { useState } from 'react';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  CardBody, 
  CardTitle, 
  Form, 
  FormGroup, 
  Label, 
  Input, 
  Button, 
  Alert 
} from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(formData.email, formData.password);
      
      // Store token and user info in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.user.role);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect based on role
      if (response.data.user.role === 'owner') {
        navigate('/dashboard'); // Owners go to dashboard
      } else {
        navigate('/dashboard'); // Admin/treasurer also go to dashboard
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión. Por favor, verifique sus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md="6" lg="4">
          <Card>
            <CardBody>
              <CardTitle className="text-center mb-4">
                <h3>Iniciar Sesión</h3>
                <p className="text-muted">Sistema Financiero Residencial</p>
              </CardTitle>
              
              {error && <Alert color="danger">{error}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <FormGroup>
                  <Label for="email">Correo Electrónico</Label>
                  <Input
                    type="email"
                    name="email"
                    id="email"
                    placeholder="Ingrese su correo electrónico"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label for="password">Contraseña</Label>
                  <Input
                    type="password"
                    name="password"
                    id="password"
                    placeholder="Ingrese su contraseña"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
                
                <Button 
                  color="primary" 
                  className="w-100 mt-3" 
                  type="submit" 
                  disabled={loading}
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </Button>
              </Form>
              
              <div className="text-center mt-3">
                <small className="text-muted">Sistema de Gestión Financiera para Conjuntos Habitacionales - Ecuador</small>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;