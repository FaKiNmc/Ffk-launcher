<div align="center">
  <h3>🌍 English | <a href="#-fklauncher-español">🇪🇸 Español</a></h3>
</div>

<br>

<div align="center">
  <img src="assets/main.png" alt="FKLauncher Main Interface" width="100%">
  <br><br>
  <h1>🚀 FKLauncher</h1>
  <p><b>Unified, Customizable and Lightweight Game Launcher</b></p>
  <p><i>Organize and launch all your games from a single, beautifully designed application.</i></p>
</div>

---

## 📖 Overview

**FKLauncher** is a custom desktop application designed to solve the problem of having multiple game clients (Steam, Epic Games, Riot, EA, Xbox, etc.) scattered across your system. It acts as a central hub, automatically detecting games from various platforms and allowing you to add your own custom executables seamlessly. 

Built with a focus on **speed, aesthetics, and user experience**, it features a sleek dark mode design, cover art fetching, and deep customization options.

> 💡 **Want to try it out?**  
> **[Download the latest version (FKLauncher-v2.0.1)](./FKLauncher.exe)** and organize your library instantly!

### Latest Version: v2.0.1 (The Ultimate Architecture)
#### ⚡ Performance & Optimization
- **Incremental Scanning:** Folder fingerprinting avoids redundant rescans.
- **Worker Threads:** Scanning process offloaded to background threads to prevent UI freezing.
- **Advanced Grid:** Implementation of `IntersectionObserver` (Lazy Loading) and Virtualization for infinite scrolling with zero lag.
- **Disk Caching:** All covers are now cached locally on disk.

#### 🎮 New Features
- **Global Integration:** Native support for GOG Galaxy, Steam, Epic, Riot, EA, and Ubisoft.
- **Fuzzy Search:** Powered by `fuse.js` for instant, error-tolerant game finding.
- **Organization:** Custom tags, categories, and ability to hide games from the library.
- **Social:** Full Discord Rich Presence integration with customizable Client ID.
- **Mini Mode:** Ultra-compact view for low-profile gaming.

#### 🎨 UX & Visuals
- **Smooth Launches:** Elaborate launch animation with blurred cover overlay and spinner.
- **Dynamic Styling:** Accent colors sync with platform brands; fixed CSS variable corruption on startup.
- **Accessibility:** Adjustable font size (12-18px) and responsive card scaling.
- **Onboarding:** Interactive 3-step setup for new users.

#### 🔄 Smart Updates
- **Delta Updates:** High-speed differential downloads (only download what changed).
- **Silent Patches:** Automatic background installation for minor version updates.
- **User Feedback:** Granular progress tracking (speed, ETA) and automated "What's New" modal after updates.

#### 🛡️ Stability & Security
- **Zustand Architecture:** State management migrated to Zustand for rock-solid data flow.
- **Centralized Logging:** Integrated `electron-log` with "View Logs" tool in Settings.
- **Resilience:** React Error Boundaries and robust executable validation for custom games.
- **Military Grade Security:** 100% obfuscated source code and tamper-resistant binaries.
- **Quality Assurance:** Full unit test suite for platform scanners (Vitest).

---

## ✨ Features

- 🎮 **Unified Game Library:** View all your installed games across launchers in one unified grid. 
- 🔗 **Platform Detection:** Native support and badging for `Steam`, `Epic Games`, `Xbox / Game Pass`, `Rockstar`, `Riot Games`, `EA App`, and `Ubisoft`.
- ➕ **Add Custom Games:** Easily add any standalone `.exe` or custom game to your library via the internal file and cover manager.
- 🎨 **Deep Customization:** Modify the primary accent color, background hex, sidebar color, text colors, and more through a built-in settings panel.
- 🖼️ **Dynamic Covers:** Full visual support for dynamic covers and custom URLs.
- ⚡ **Lightweight & Fast:** Designed to minimize resource usage. Configurable option to auto-minimize when a game is launched to free up resources.
- 🔍 **Real-Time Search:** Instantly find your games across your huge library with keyboard shortcuts (`Ctrl+F`).
- 🏃 **Quick Launcher Access:** Direct links in the sidebar to open the original clients natively.

---

## 📸 Screenshots

### Settings & Customization
Take control over the look and feel. Tweak the interface elements via precise Hex codes and configure launcher behavior like auto-minimize.
<img src="assets/settings.png" alt="FKLauncher Settings" width="80%">

### Adding Custom Games
A simple and intuitive UI for adding standalone executables, complete with automatic path browsing and optional cover URL fetching.
<img src="assets/add_game.png" alt="Add Custom Game" width="80%">


---
---

<br>

<div align="center">
  <h3><a href="#-fklauncher">🌍 English</a> | 🇪🇸 Español</h3>
</div>

<br>

<div align="center">
  <img src="assets/main.png" alt="FKLauncher Interfaz Principal" width="100%">
  <br><br>
  <h1>🚀 FKLauncher (Español)</h1>
  <p><b>Lanzador de Juegos Unificado, Personalizable y Ligero</b></p>
  <p><i>Organiza y lanza todos tus juegos desde una única aplicación con un hermoso diseño.</i></p>
</div>

---

## 📖 Descripción General

**FKLauncher** es una aplicación de escritorio personalizada diseñada para resolver el problema de tener múltiples clientes de juegos (Steam, Epic Games, Riot, EA, Xbox, etc.) dispersos por tu sistema. Actúa como un centro unificado, detectando automáticamente los juegos de varias plataformas y permitiéndote añadir tus propios ejecutables personalizados de forma fluida.

Construido con un enfoque en la **velocidad, la estética y la experiencia del usuario**, cuenta con un elegante diseño en modo oscuro, obtención de portadas y profundas opciones de personalización.

> 💡 **¿Quieres probarlo?**  
> **[Descarga la última versión (FKLauncher-v2.0.1)](./FKLauncher.exe)** ¡y organiza tu biblioteca al instante!

### Versión Actual: v2.0.1 (La Arquitectura Definitiva)
#### ⚡ Rendimiento y Optimización
- **Escaneo Incremental:** El fingerprinting de carpetas evita re-escaneos redundantes.
- **Hilos de Trabajo (Workers):** Proceso de escaneo delegado a hilos secundarios para evitar bloqueos en la interfaz.
- **Grid Avanzado:** Implementación de `IntersectionObserver` (Lazy Loading) y Virtualización para un scroll infinito sin lag.
- **Caché en Disco:** Todas las portadas se guardan localmente para cargas instantáneas.

#### 🎮 Nuevas Funcionalidades
- **Integración Global:** Soporte nativo para GOG Galaxy, Steam, Epic, Riot, EA y Ubisoft.
- **Búsqueda Fuzzy:** Potenciada por `fuse.js` para encontrar juegos al instante, incluso con errores de escritura.
- **Organización:** Etiquetas personalizadas, categorías y opción para ocultar juegos.
- **Social:** Integración completa de Discord Rich Presence con Client ID personalizable.
- **Modo Mini:** Vista ultra-compacta para jugar con perfil bajo.

#### 🎨 UX y Visuales
- **Lanzamientos Fluidos:** Animación de carga elaborada con overlay de portada blureada y spinner.
- **Estilo Dinámico:** Los colores de acento se sincronizan con las plataformas; corrección de corrupción de variables CSS al inicio.
- **Accesibilidad:** Tamaño de fuente ajustable (12-18px) y escalado de tarjetas responsivo.
- **Bienvenida:** Asistente interactivo de 3 pasos para nuevos usuarios.

#### 🔄 Actualizaciones Inteligentes
- **Delta Updates:** Descargas diferenciales de alta velocidad (solo descarga lo que ha cambiado).
- **Parches Silenciosos:** Instalación automática en segundo plano para actualizaciones menores.
- **Feedback de Usuario:** Seguimiento granular del progreso (velocidad, tiempo restante) y modal de "Novedades" automático tras actualizar.

#### 🛡️ Estabilidad y Seguridad
- **Arquitectura Zustand:** Migración completa de estado a Zustand para un flujo de datos sólido.
- **Logs Centralizados:** Integración con `electron-log` con herramienta "Ver logs" en Configuración.
- **Resiliencia:** Error Boundaries en React y validación robusta de ejecutables para juegos personalizados.
- **Seguridad Grado Militar:** Código fuente 100% ofuscado y binario protegido contra ingeniería inversa.
- **Calidad Garantizada:** Suite completa de tests unitarios para los scanners de plataformas (Vitest).

---

## ✨ Características Principales

- 🎮 **Biblioteca de Juegos Unificada:** Visualiza todos tus juegos instalados en diferentes lanzadores en una única cuadrícula unificada.
- 🔗 **Detección de Plataformas:** Soporte nativo e insignias para `Steam`, `Epic Games`, `Xbox / Game Pass`, `Rockstar`, `Riot Games`, `EA App` y `Ubisoft`.
- ➕ **Añadir Juegos Personalizados:** Añade fácilmente cualquier `.exe` independiente o juego personalizado a tu biblioteca mediante el gestor interno de rutas y carátulas.
- 🎨 **Personalización Profunda:** Modifica el color de acento principal, el fondo hexadecimal, el color de la barra lateral, los colores del texto y más a través de un panel de configuración integrado.
- 🖼️ **Portadas Dinámicas:** Soporte visual completo para carátulas dinámicas y URLs personalizadas.
- ⚡ **Ligero y Rápido:** Diseñado para minimizar el uso de recursos. Opción configurable para minimizarse automáticamente al lanzar un juego, liberando recursos.
- 🔍 **Búsqueda en Tiempo Real:** Encuentra instantáneamente tus juegos en toda tu biblioteca con atajos de teclado (`Ctrl+F`).
- 🏃 **Acceso Rápido a Lanzadores:** Enlaces directos en la barra lateral para abrir los clientes originales de forma nativa.

---

## 📸 Capturas de Pantalla

### Configuración y Personalización
Toma el control del aspecto visual. Ajusta los elementos de la interfaz mediante códigos Hexadecimales precisos y configura el comportamiento del lanzador como el auto-minimizado.
<img src="assets/settings.png" alt="Ajustes y Configuración" width="80%">

### Añadir Juegos Personalizados
Una interfaz de usuario sencilla e intuitiva para añadir ejecutables de forma independiente, que incluye búsqueda automática de rutas y descarga opcional de la URL de la portada.
<img src="assets/add_game.png" alt="Añadir Juego Personalizado" width="80%">

---

<div align="center">
  <i>Developed to keep gaming simple, clean, and unified.</i>
  <br><br>
  <p>© 2026 Ismael Pérez (FKShield). All Rights Reserved.</p>
</div>
