import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// 1. GET /articles - Lister tous les articles (200)
app.get('/articles', async (req, res) => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('id', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json(data);
});

// 2. POST /articles - Ajouter un article (201 ou 400)
app.post('/articles', async (req, res) => {
  const { name, category, price, image_url, in_stock } = req.body;

  if (!name || name.trim() === '' || price === undefined || Number(price) < 0) {
    return res.status(400).json({ error: 'Nom obligatoire ou prix négatif' });
  }

  const { data, error } = await supabase.from('articles').insert([{
    name: name.trim(),
    category: category || 'Sneakers',
    price: Number(price),
    image_url: image_url || 'https://via.placeholder.com/300',
    in_stock: in_stock !== undefined ? in_stock : true
  }]).select();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

// 3. PUT /articles/:id - Modifier un article (200 ou 404/400)
app.put('/articles/:id', async (req, res) => {
  const { id } = req.params;
  const { name, category, price, image_url, in_stock } = req.body;

  if (price !== undefined && Number(price) < 0) {
    return res.status(400).json({ error: 'Le prix ne peut pas être négatif' });
  }

  const { data, error } = await supabase
    .from('articles')
    .update({ name, category, price, image_url, in_stock })
    .eq('id', id)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: 'Article introuvable' });

  res.status(200).json(data[0]);
});

// 4. DELETE /articles/:id - Supprimer un article (204)
app.delete('/articles/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('articles').delete().eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  res.sendStatus(204);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur prêt sur http://localhost:${PORT}`);
});