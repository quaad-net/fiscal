function ErrorBoundary() {
    return (
        <div style={{height: '100vh', width: 'fit-content', margin: 'auto', paddingTop: '200px', color: 'white'}}>
        <h1>Error</h1>
        <p>
          <i>Something went wrong!</i>
        </p>
      </div>
    )
}

export default ErrorBoundary;
