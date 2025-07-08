const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(express.json());

// 🔷 Conexión a MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '12345678', // coloca aquí tu contraseña si tienes
  database: 'tiendapepito',
  port: 3306
});

// 🔷 Verifica conexión
db.connect(err => {
  if (err) {
    console.error('❌ Error al conectar a MySQL:', err);
    return;
  }
  console.log('✅ Conectado a MySQL - tiendaPepito');
});

// 🔷 GET todos los deudores
app.get('/api/deudores', (req, res) => {
  db.query('SELECT * FROM deudores', (err, rows) => {
    if (err) return res.status(500).json(err);
    console.log('🔵 Deudores cargados:', rows);
    res.json(rows);
  });
});

// 🔷 POST crear nuevo deudor
app.post('/api/deudores', (req, res) => {
  const { nombreDeudor, productos, monto } = req.body;
  const estado = 'pendiente';

  console.log('🔵 Datos recibidos en POST:', req.body);

  if (!nombreDeudor || !productos || !monto) {
    console.log('❌ Campos faltantes');
    return res.status(400).json({ message: 'Todos los campos son requeridos' });
  }

  const sql = 'INSERT INTO deudores (nombreDeudor, productos, monto, estado) VALUES (?, ?, ?, ?)';
  db.query(sql, [nombreDeudor, productos, monto, estado], (err, result) => {
    if (err) {
      console.error('❌ Error al insertar:', err);
      return res.status(500).json(err);
    }
    console.log('✅ Nuevo deudor insertado con id:', result.insertId);
    res.json({ idDeudor: result.insertId, nombreDeudor, productos, monto, estado });
  });
});

// 🔷 PUT actualizar estado
app.put('/api/deudores/:id', (req, res) => {
  const { estado } = req.body;

  const sql = 'UPDATE deudores SET estado=? WHERE iddeudores=?';
  db.query(sql, [estado, req.params.id], (err, result) => {
    if (err) {
      console.error('❌ Error al actualizar estado:', err);
      return res.status(500).json(err);
    }
    res.json({ iddeudores: req.params.id, estado }); // 🔴 Aquí devuelves estado
  });
});

// 🔷 DELETE eliminar deudor
app.delete('/api/deudores/:id', (req, res) => {
  db.query('DELETE FROM deudores WHERE iddeudores=?', [req.params.id], (err, result) => {
    if (err) {
      console.error('❌ Error al eliminar deudor:', err);
      return res.status(500).json(err);
    }
    res.json({ mensaje: 'Eliminado' });
  });
});

// 🔷 Iniciar servidor
app.listen(3000, () => {
  console.log('🚀 Servidor corriendo en http://localhost:3000');
});
