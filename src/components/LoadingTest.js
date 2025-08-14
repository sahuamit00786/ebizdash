import React, { useState, useEffect } from 'react'
import './LoadingTest.css'

const LoadingTest = () => {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading for 3 seconds
    const timer = setTimeout(() => {
      setLoading(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="loading-test-container">
        <h2>Loading Spinner Test</h2>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Testing loading spinner...</div>
        </div>
        <div className="spinner-info">
          <p>This spinner should be perfectly round and rotating.</p>
          <p>If you see a straight line instead of a circle, there's a CSS issue.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="loading-test-container">
      <h2>Loading Test Complete</h2>
      <p>The loading spinner should have appeared as a rotating circle.</p>
      <button onClick={() => setLoading(true)}>Test Again</button>
    </div>
  )
}

export default LoadingTest
