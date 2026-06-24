import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    // This saves the data to your new Vercel database
    const newData = req.body;
    await kv.set('universal_site_data', newData);
    res.status(200).json({ message: 'Saved successfully!' });
  } else if (req.method === 'GET') {
    // This reads the data from your database for everyone
    const savedData = await kv.get('universal_site_data');
    res.status(200).json(savedData || {}); 
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
