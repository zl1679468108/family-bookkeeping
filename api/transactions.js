import { supabase } from '../src/services/supabase'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { amount, category, type, date, description, image_url } = req.body

    if (!amount || !category || !type || !date) {
      return res.status(400).json({ success: false, error: '缺少必填字段' })
    }

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          amount: parseFloat(amount),
          category,
          type,
          date,
          description: description || '',
          image_url: image_url || null
        }])
        .select()

      if (error) throw error

      res.status(200).json({ success: true, data: data[0] })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  } else if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error

      res.status(200).json({ success: true, data })
    } catch (error) {
      res.status(500).json({ success: false, error: error.message })
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}