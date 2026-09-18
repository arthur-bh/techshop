// =============================================================
// BACKEND - SERVER.JS (EXPRESS + MYSQL + GOOGLE AUTH)
// =============================================================
import express from 'express';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import { OAuth2Client } from 'google-auth-library';

const app = express();
const PORT = 3000;

// Se o professor passou um CLIENT_ID do Google, substitua abaixo.
// Caso contrário, pode manter esta chave de teste.
const GOOGLE_CLIENT_ID = 'SEU_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Conexão com o banco de dados
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '1234', // Ajuste sua senha aqui
  database: 'techshop',
  waitForConnections: true,
  connectionLimit: 10
});

// Middleware de verificação de token do Google e perfil
const verificarAcesso = (nivelRequerido) => {
  return async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const nivelUsuario = req.headers['user-level'];

    // Se houver token do Google enviado no cabeçalho Bearer
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        req.userGoogle = payload; // Dados da conta Google do usuário
      } catch (error) {
        return res.status(401).json({ erro: 'Token do Google inválido ou expirado.' });
      }
    }

    if (!nivelUsuario) {
      return res.status(401).json({ erro: 'Usuário não identificado.' });
    }

    if (nivelRequerido === 'Admin' && nivelUsuario !== 'Admin') {
      return res.status(403).json({ erro: 'Acesso negado. Apenas Administradores podem realizar esta operação.' });
    }

    next();
  };
};

// -------------------------------------------------------------
// ENDPOINTS
// -------------------------------------------------------------

app.get('/api/relatorio-vendas', async (req, res) => {
  try {
    const query = `
      SELECT p.id_pedido, c.nome AS nome_cliente,
             SUM(i.quantidade * i.preco_unitario) AS total_pedido, p.status_pedido
      FROM pedidos p
      INNER JOIN clientes c ON p.id_cliente = c.id_cliente
      INNER JOIN itens_pedido i ON p.id_pedido = i.id_pedido
      GROUP BY p.id_pedido, c.nome, p.status_pedido;
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.get('/api/estoque', async (req, res) => {
  try {
    const query = `
      SELECT prod.id_produto, prod.nome_produto, prod.estoque AS estoque_atual,
             IFNULL(SUM(itens.quantidade), 0) AS total_unidades_vendidas
      FROM produtos prod
      LEFT JOIN itens_pedido itens ON prod.id_produto = itens.id_produto
      GROUP BY prod.id_produto, prod.nome_produto, prod.estoque;
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.get('/api/clientes', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id_cliente, nome, email FROM clientes');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.put('/api/produtos/:id', verificarAcesso('Admin'), async (req, res) => {
  const { id } = req.params;
  const { novoEstoque } = req.body;

  if (novoEstoque === undefined || novoEstoque < 0) {
    return res.status(400).json({ erro: 'Quantidade de estoque inválida.' });
  }

  try {
    const [result] = await pool.query('UPDATE produtos SET estoque = ? WHERE id_produto = ?', [novoEstoque, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Produto não encontrado.' });
    }
    res.json({ mensagem: 'Estoque atualizado com sucesso!' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.delete('/api/clientes/:id', verificarAcesso('Admin'), async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM clientes WHERE id_cliente = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ erro: 'Cliente não encontrado.' });
    }
    res.json({ mensagem: 'Cliente removido com sucesso!' });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor TechShop rodando em http://localhost:${PORT}`);
});
import express from 'express';
import mongoose from 'mongoose';

constapp = express();
app.use(express.json());

// Utilize a variável de ambiente para a URI do MongoDB
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Conectado ao MongoDB Atlas'))
  .catch((err) => console.error('❌ Erro ao conectar no MongoDB:', err));

// Defina as suas rotas normalmente
app.get('/', (req, res) => res.send('API Techshop a funcionar!'));

// Exportação necessária para o Vercel
export default app;
module.exports = app;