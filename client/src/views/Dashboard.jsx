import React, { useEffect, useState } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardText,
  Spinner
} from 'reactstrap';
import { Bar, Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { dashboardAPI } from '../utils/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [debtors, setDebtors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [summaryRes, trendsRes, debtorsRes] = await Promise.all([
        dashboardAPI.getSummary(),
        dashboardAPI.getPaymentTrends(),
        dashboardAPI.getDebtors()
      ]);

      setSummary(summaryRes.data);
      setTrends(trendsRes.data);
      setDebtors(debtorsRes.data.debtors);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const monthlyTrendData = {
    labels: trends?.monthlyTrend?.map(item => item.month) || [],
    datasets: [
      {
        label: 'Total Recaudado',
        data: trends?.monthlyTrend?.map(item => item.total) || [],
        backgroundColor: 'rgba(78, 115, 223, 0.6)',
        borderColor: 'rgba(78, 115, 223, 1)',
        borderWidth: 1,
      },
    ],
  };

  const conceptDistributionData = {
    labels: trends?.conceptDistribution?.map(item => {
      switch(item.concept) {
        case 'monthly_fee': return 'Expensas Mensuales';
        case 'water': return 'Agua';
        case 'communal_house': return 'Casa Comunal';
        case 'parking': return 'Parqueaderos';
        default: return item.concept;
      }
    }) || [],
    datasets: [
      {
        data: trends?.conceptDistribution?.map(item => item.total) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 205, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Gráfico de ejemplo'
      }
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <Spinner color="primary" />
          <p className="mt-2">Cargando datos del dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="mt-4">
      <Row>
        <Col xl={3} md={6} className="mb-4">
          <Card className="border-start-primary shadow h-100 py-2">
            <CardBody>
              <Row className="align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Recaudado Este Mes
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    ${summary?.totalCollectedThisMonth?.toFixed(2) || '0.00'}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-calendar fa-2x text-gray-300"></i>
                </div>
              </Row>
            </CardBody>
          </Card>
        </Col>

        <Col xl={3} md={6} className="mb-4">
          <Card className="border-start-success shadow h-100 py-2">
            <CardBody>
              <Row className="align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Número de Deudores
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {summary?.debtorCount || 0}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-dollar-sign fa-2x text-gray-300"></i>
                </div>
              </Row>
            </CardBody>
          </Card>
        </Col>

        <Col xl={3} md={6} className="mb-4">
          <Card className="border-start-info shadow h-100 py-2">
            <CardBody>
              <Row className="align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Saldo a Favor
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {summary?.creditCount || 0}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-clipboard-list fa-2x text-gray-300"></i>
                </div>
              </Row>
            </CardBody>
          </Card>
        </Col>

        <Col xl={3} md={6} className="mb-4">
          <Card className="border-start-warning shadow h-100 py-2">
            <CardBody>
              <Row className="align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    % de Cumplimiento
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    {summary?.compliancePercentage || 0}%
                  </div>
                </div>
                <div className="col-auto">
                  <i className="fas fa-percentage fa-2x text-gray-300"></i>
                </div>
              </Row>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={8}>
          <Card className="shadow mb-4">
            <CardHeader className="py-3">
              <CardTitle className="m-0 font-weight-bold text-primary">
                Total Recaudado por Mes (Últimos 12 Meses)
              </CardTitle>
            </CardHeader>
            <CardBody>
              <div className="chart-container">
                <Bar data={monthlyTrendData} options={options} />
              </div>
            </CardBody>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="shadow mb-4">
            <CardHeader className="py-3">
              <CardTitle className="m-0 font-weight-bold text-primary">
                Distribución por Concepto
              </CardTitle>
            </CardHeader>
            <CardBody>
              <div className="chart-container">
                <Pie data={conceptDistributionData} options={options} />
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="shadow mb-4">
            <CardHeader className="py-3">
              <CardTitle className="m-0 font-weight-bold text-primary">
                Lista de Deudores
              </CardTitle>
            </CardHeader>
            <CardBody>
              {debtors.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Casa</th>
                        <th>Propietario</th>
                        <th>Contacto</th>
                        <th>Meses Adeudados</th>
                        <th>Período Más Antiguo</th>
                        <th>Deuda Estimada</th>
                      </tr>
                    </thead>
                    <tbody>
                      {debtors.slice(0, 5).map((debtor, index) => (
                        <tr key={index}>
                          <td>{debtor.propertyNumber}</td>
                          <td>{debtor.ownerName}</td>
                          <td>{debtor.contactEmail || debtor.contactPhone || 'N/A'}</td>
                          <td>{debtor.monthsInArrears}</td>
                          <td>{debtor.oldestUnpaidPeriod}</td>
                          <td>${debtor.estimatedDebt}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {debtors.length > 5 && (
                    <CardText className="text-center mt-3">
                      Y {debtors.length - 5} deudores más...
                    </CardText>
                  )}
                </div>
              ) : (
                <CardText className="text-center">No hay deudores registrados</CardText>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Dashboard;