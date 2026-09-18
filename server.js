import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Conexão com MongoDB Atlas usando a variável de ambiente
const MONGO_URI = process.env.MONGO_URI;

if (MONGO_URI) {
  mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ Conectado ao MongoDB Atlas'))
    .catch((err) => console.error('❌ Erro ao conectar no MongoDB:', err));
}

// Rotas da API
app.get('/', (req, res) => {
  res.send('API Techshop a funcionar!');
});

app.get('/api/relatorio-vendas', async (req, res) => {
  try {
    res.json({ mensagem: "Rota de vendas ativa" });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.get('/api/estoque', async (req, res) => {
  try {
    res.json({ mensagem: "Rota de estoque ativa" });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.get('/api/clientes', async (req, res) => {
  try {
    res.json({ mensagem: "Rota de clientes ativa" });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// Apenas escuta a porta em ambiente local
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor a rodar localmente em http://localhost:${PORT}`);
  });
}

// Exportação compatível com Vercel
export default app;