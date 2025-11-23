import { useState, useEffect } from 'react'

function App() {
  const [status, setStatus] = useState('Checking API...')

  useEffect(() => {
    fetch('/api/node/')
      .then(res => {
        if(res.ok) return res.text();
        throw new Error('Network response was not ok');
      })
      .then(data => setStatus(`Connected: ${data}`))
      .catch(err => setStatus(`Error: ${err.message} (Is Docker Running?)`));
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow-md">
        <h1 className="text-2xl font-bold mb-4 text-blue-600">Nimonspedia Client</h1>
        <p className="text-gray-700">Status Backend: <span className="font-mono font-bold">{status}</span></p>
        <p className="mt-4 text-sm text-gray-500">Edit client/src/App.jsx to start building.</p>
      </div>
    </div>
  )
}

export default App