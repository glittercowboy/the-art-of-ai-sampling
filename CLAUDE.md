# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains a website for "The Art of AI Sampling with TÂCHES" - a landing page for a course about using AI tools for music production. The website is built with standard HTML, CSS, and JavaScript without any frameworks.

The main components are:
- `index.html`: The single-page website structure
- `styles.css`: All styling for the website
- `script.js`: JavaScript for interactive elements (typing animation, FAQ accordion, etc.)
- `/images/`: Directory containing all images used on the website

## Website Architecture

The website follows a simple structure:
- Header section with logo and introduction
- Main content sections:
  - Introduction with expandable "Read More" content
  - Course overview with cards for different modules
  - Information about the purpose of the course
  - Pricing and enrollment section
  - Notes about AI music quality
  - FAQ section

## Development Workflow

### Local Development

To view the website locally:
```bash
# Using Python's built-in HTTP server
python -m http.server

# OR using Node's http-server if installed
npx http-server
```

Then open http://localhost:8000 in your browser.

### Web Hosting

The website is designed to be hosted on a standard web server with no special requirements. All assets are contained within the repository.

## Design Guidelines

When making changes to the website, follow these principles from the `website-design-brief.md`:

- Use clean, minimalist design that prioritizes readability and content hierarchy
- Maintain a flowing, natural reading experience
- Include plenty of white space to let content breathe
- Use the established muted, professional color palette
- Preserve the subtle animated transitions
- Present information in a logical, structured way
- Maintain clear content sections with intuitive navigation

Avoid:
- Aggressive marketing tactics or psychological triggers
- Countdown timers or artificial scarcity indicators
- High-pressure sales language or bold claims
- Pop-ups or intrusive elements
- Bright, attention-grabbing colors
- Unnecessary decorative elements

## Style Guide

### Typography
- Primary headings: "Poppins", sans-serif
- Monospace text: "Cutive Mono", monospace
- Body text: "Inter", sans-serif

### Colors
- Primary accent: #e6ac55
- Text color: #000000
- Background: #f0f0f0
- Subtle background: #f9f9f9
- Card background: #f7f7f7
- Muted text: #666

These values are defined as CSS variables in `styles.css` and should be referenced rather than using hard-coded values.

## Content Tone

Content updates should maintain the established tone:
- Conversational and authentic voice
- Specific, concrete details
- Technical terminology where appropriate
- Professional but approachable tone
- Transparent about limitations and requirements

Avoid:
- Marketing buzzwords
- Exaggerated claims
- High-pressure language
- Artificial urgency
- Unnecessary hype