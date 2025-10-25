import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import './App.css'
import { WebcamStream } from './WebcamStream'

// API_BASEを環境変数から動的に構築
const API_PORT = import.meta.env.VITE_BACKEND_API_PORT || '3000'
const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://localhost:${API_PORT}/api`

function App() {
  const { t, i18n } = useTranslation()
  const [gpioState, setGpioState] = useState<'on' | 'off'>('off')
  const [ledColor, setLedColor] = useState({ r: 0, g: 0, b: 0 })
  const [brightness, setBrightness] = useState(100)
  const [status, setStatus] = useState<string>('')

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'ja' : 'en')
  }

  // GPIO制御
  const handleGpio = async (state: 'on' | 'off') => {
    try {
      const response = await fetch(`${API_BASE}/gpio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state })
      })
      const data = await response.json()
      if (data.success) {
        setGpioState(state)
        setStatus(t('messages.gpioSuccess', { state: state.toUpperCase() }))
      } else {
        setStatus(t('messages.error', { message: data.error }))
      }
    } catch (error) {
      setStatus(t('messages.error', { message: String(error) }))
    }
  }

  // LED ON/OFF
  const handleLedOnOff = async (turnOn: boolean) => {
    try {
      const response = await fetch(`${API_BASE}/led/${turnOn ? 'on' : 'off'}`, {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        setStatus(t('messages.ledSuccess', { state: turnOn ? 'ON' : 'OFF' }))
        if (!turnOn) {
          setLedColor({ r: 0, g: 0, b: 0 })
        } else {
          setLedColor({ r: 255, g: 255, b: 255 })
        }
      } else {
        setStatus(t('messages.error', { message: data.error }))
      }
    } catch (error) {
      setStatus(t('messages.error', { message: String(error) }))
    }
  }

  // LED色変更
  const handleColorChange = async () => {
    // 照度を適用
    const adjustedColor = {
      r: Math.round((ledColor.r * brightness) / 100),
      g: Math.round((ledColor.g * brightness) / 100),
      b: Math.round((ledColor.b * brightness) / 100)
    }

    try {
      const response = await fetch(`${API_BASE}/led`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustedColor)
      })
      const data = await response.json()
      if (data.success) {
        setStatus(t('messages.ledColorSuccess', {
          r: adjustedColor.r,
          g: adjustedColor.g,
          b: adjustedColor.b
        }))
      } else {
        setStatus(t('messages.error', { message: data.error }))
      }
    } catch (error) {
      setStatus(t('messages.error', { message: String(error) }))
    }
  }

  // プリセットカラー
  const presetColors = [
    { name: 'red', key: 'led.presetColors.red', r: 255, g: 0, b: 0 },
    { name: 'green', key: 'led.presetColors.green', r: 0, g: 255, b: 0 },
    { name: 'blue', key: 'led.presetColors.blue', r: 0, g: 0, b: 255 },
    { name: 'yellow', key: 'led.presetColors.yellow', r: 255, g: 255, b: 0 },
    { name: 'purple', key: 'led.presetColors.purple', r: 255, g: 0, b: 255 },
    { name: 'cyan', key: 'led.presetColors.cyan', r: 0, g: 255, b: 255 },
    { name: 'white', key: 'led.presetColors.white', r: 255, g: 255, b: 255 }
  ]

  const applyPreset = async (color: { r: number; g: number; b: number }) => {
    setLedColor(color)
    const adjustedColor = {
      r: Math.round((color.r * brightness) / 100),
      g: Math.round((color.g * brightness) / 100),
      b: Math.round((color.b * brightness) / 100)
    }

    try {
      const response = await fetch(`${API_BASE}/led`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adjustedColor)
      })
      const data = await response.json()
      if (data.success) {
        setStatus(t('messages.presetSuccess'))
      } else {
        setStatus(t('messages.error', { message: data.error }))
      }
    } catch (error) {
      setStatus(t('messages.error', { message: String(error) }))
    }
  }

  return (
    <div className="app">
      <h1>
        {t('title')}
        <button onClick={toggleLanguage} style={{ marginLeft: '20px', fontSize: '14px', padding: '8px 16px' }}>
          {i18n.language === 'en' ? '日本語' : 'English'}
        </button>
      </h1>

      <div className="app-layout">
        <div className="left-panel">
          <WebcamStream width={640} height={480} />
        </div>

        <div className="right-panel">
          {status && <div className="status">{status}</div>}

          <section className="control-section">
        <h2>{t('gpio.title')}</h2>
        <div className="toggle-container">
          <span className="toggle-label">{t('gpio.label')}:</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={gpioState === 'on'}
              onChange={(e) => handleGpio(e.target.checked ? 'on' : 'off')}
            />
            <span className="toggle-slider"></span>
          </label>
          <span className={`toggle-status ${gpioState === 'on' ? 'on' : 'off'}`}>
            {t(`gpio.${gpioState}`)}
          </span>
        </div>
      </section>

      <section className="control-section">
        <h2>{t('led.onoff')}</h2>
        <div className="toggle-container">
          <span className="toggle-label">LED:</span>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={ledColor.r > 0 || ledColor.g > 0 || ledColor.b > 0}
              onChange={(e) => handleLedOnOff(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
          <span className={`toggle-status ${(ledColor.r > 0 || ledColor.g > 0 || ledColor.b > 0) ? 'on' : 'off'}`}>
            {(ledColor.r > 0 || ledColor.g > 0 || ledColor.b > 0) ? 'ON' : 'OFF'}
          </span>
        </div>
      </section>

      <section className="control-section">
        <h2>{t('led.color')}</h2>

        <div className="color-sliders">
          <div className="slider-group">
            <label>{t('led.red')} (R): {ledColor.r}</label>
            <input
              type="range"
              min="0"
              max="255"
              value={ledColor.r}
              onChange={(e) => setLedColor({ ...ledColor, r: parseInt(e.target.value) })}
              className="slider red"
            />
          </div>

          <div className="slider-group">
            <label>{t('led.green')} (G): {ledColor.g}</label>
            <input
              type="range"
              min="0"
              max="255"
              value={ledColor.g}
              onChange={(e) => setLedColor({ ...ledColor, g: parseInt(e.target.value) })}
              className="slider green"
            />
          </div>

          <div className="slider-group">
            <label>{t('led.blue')} (B): {ledColor.b}</label>
            <input
              type="range"
              min="0"
              max="255"
              value={ledColor.b}
              onChange={(e) => setLedColor({ ...ledColor, b: parseInt(e.target.value) })}
              className="slider blue"
            />
          </div>
        </div>

        <div className="color-preview" style={{
          backgroundColor: `rgb(${ledColor.r}, ${ledColor.g}, ${ledColor.b})`,
          width: '100%',
          height: '60px',
          borderRadius: '8px',
          margin: '15px 0'
        }}></div>

        <h3>{t('led.presetTitle')}</h3>
        <div className="preset-colors">
          {presetColors.map((color) => (
            <button
              key={color.name}
              onClick={() => applyPreset(color)}
              className="preset-btn"
              style={{
                backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`
              }}
            >
              {t(color.key)}
            </button>
          ))}
        </div>

        <button onClick={handleColorChange} className="apply-btn">
          {t('led.apply')}
        </button>
      </section>

      <section className="control-section">
        <h2>{t('led.brightness')}</h2>
        <div className="slider-group">
          <label>{t('led.brightnessLabel')}: {brightness}%</label>
          <input
            type="range"
            min="0"
            max="100"
            value={brightness}
            onChange={(e) => setBrightness(parseInt(e.target.value))}
            className="slider brightness"
          />
        </div>
        <button onClick={handleColorChange} className="apply-btn">
          {t('led.applyBrightness')}
        </button>
      </section>
        </div>
      </div>
    </div>
  )
}

export default App
