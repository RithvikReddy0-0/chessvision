# ChessVision — the website

An interactive explainer for the [ChessVision](https://github.com/RithvikReddy0-0/Computer_V)
computer-vision pipeline: a photograph of a chessboard becomes a position becomes a plan.

**Live:** https://chess.rithvikreddy.dev

Dark editorial scrollytelling walking through the four pipeline stages
(photo → board detection + warp → a CNN over 64 squares → FEN → engine best move),
plus an interactive board that shows a reconstructed position and the engine's move.

Static site — `index.html`, `styles.css`, `main.js`. GSAP + ScrollTrigger from CDN; no build step.
