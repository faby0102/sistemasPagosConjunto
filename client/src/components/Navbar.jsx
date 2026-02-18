import React, { useState } from 'react';
import {
  Collapse,
  Navbar,
  NavbarToggler,
  NavbarBrand,
  Nav,
  NavItem,
  NavLink,
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';
import { Link, useNavigate } from 'react-router-dom';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role');
  const userName = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : '';

  const toggle = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Navbar color="dark" dark expand="md" fixed="top">
      <NavbarBrand tag={Link} to="/dashboard">Sistema Financiero Residencial</NavbarBrand>
      <NavbarToggler onClick={toggle} />
      <Collapse isOpen={isOpen} navbar>
        <Nav className="me-auto" navbar>
          <NavItem>
            <NavLink tag={Link} to="/dashboard">Dashboard</NavLink>
          </NavItem>
          
          {(userRole === 'admin' || userRole === 'treasurer') && (
            <>
              <NavItem>
                <NavLink tag={Link} to="/properties">Propiedades</NavLink>
              </NavItem>
              <NavItem>
                <NavLink tag={Link} to="/payments">Pagos</NavLink>
              </NavItem>
              <NavItem>
                <NavLink tag={Link} to="/reports">Reportes</NavLink>
              </NavItem>
              <NavItem>
                <NavLink tag={Link} to="/debtors">Deudores</NavLink>
              </NavItem>
            </>
          )}
        </Nav>
        <Nav className="ms-auto" navbar>
          <UncontrolledDropdown nav inNavbar>
            <DropdownToggle nav caret>
              {userName} ({userRole})
            </DropdownToggle>
            <DropdownMenu end>
              <DropdownItem header>Bienvenido, {userName}</DropdownItem>
              <DropdownItem divider />
              <DropdownItem onClick={handleLogout}>Cerrar sesión</DropdownItem>
            </DropdownMenu>
          </UncontrolledDropdown>
        </Nav>
      </Collapse>
    </Navbar>
  );
};

export default Navigation;