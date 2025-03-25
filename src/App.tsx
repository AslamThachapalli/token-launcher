function App() {

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100vw',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
      }}>
        <input type="text" placeholder="Name" />
        <input type="text" placeholder="Symbol" />
        <input type="text" placeholder="Decimals" />
        <input type="text" placeholder="Supply" />
        <input type="text" placeholder="Description" />
        <input type="text" placeholder="Image URL" />
      </div>
      <div>
        <button>Create Token</button>
      </div>
    </div>
  )
}

export default App
