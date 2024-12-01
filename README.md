# Creact: A Simplified React Clone

Welcome to **Creact**, a lightweight and educational JavaScript library inspired by React. Creact demonstrates how React's core concepts, such as virtual DOM, reconciliation, hooks, and fiber architecture, work under the hood.

This project is perfect for anyone looking to deepen their understanding of how modern front-end libraries manage rendering, updates, and state efficiently.

---

## Features

1. **Virtual DOM**:
   - Renders elements as a virtual representation before committing changes to the real DOM.
   - Includes support for text nodes with a special `TEXT_ELEMENT` type.

2. **Fiber Architecture**:
   - Breaks rendering work into small units (`fibers`) to process during idle time using `requestIdleCallback`.

3. **Reconciliation**:
   - Efficiently updates the DOM by comparing the current tree with the previous one (diffing).
   - Handles placement, updates, and deletions.

4. **State Management**:
   - Provides a `useState` hook for managing state in functional components.

5. **Declarative Rendering**:
   - Allows you to define UI components and update them with changes in state or props.

---

## Getting Started

### Prerequisites

- A modern web browser.
- Basic knowledge of HTML, CSS, and JavaScript.

---

### Running the Example

1. **Clone the repository** (or copy the code into your project).
2. Create an HTML file and include a `<div id="root"></div>` as the mounting point.
3. Add the script to your project and run it in your browser.

Example:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Creact Example</title>
</head>
<body>
  <div id="root"></div>
  <script src="creact.js"></script>
</body>
</html>
```

---

## How It Works

### Core Functions

1. **`createElement`**:
   - Creates a virtual DOM element with properties and children.
   - Example: `<div>Hello</div>` becomes a JavaScript object representation.

2. **`render`**:
   - Mounts a virtual DOM tree into a real DOM container.

3. **`useState`**:
   - Allows functional components to manage state with a simple API:
     ```javascript
     const [state, setState] = Creact.useState(initialValue);
     ```

4. **Fiber Tree**:
   - Creact uses a fiber tree to represent the virtual DOM, enabling granular updates and efficient diffing.

---

### Example: Counter Component

```javascript
/** @jsx Creact.createElement */

function Counter() {
  const [state, setState] = Creact.useState(1); // Initialize state
  return (
    <h1 onClick={() => setState(c => c + 1)}>
      Count: {state}
    </h1>
  );
}

const element = <Counter />;
const container = document.getElementById("root");
Creact.render(element, container);
```

---

## Code Structure

1. **Virtual DOM**:
   - `createElement`: Constructs the virtual DOM elements.
   - `createTextElement`: Handles text nodes.

2. **Rendering**:
   - `createDom`: Converts virtual DOM elements to real DOM nodes.
   - `render`: Sets up the root fiber and begins the rendering process.

3. **Fiber Tree & Reconciliation**:
   - `reconcileChildren`: Updates the fiber tree based on changes.
   - `commitWork`: Applies changes to the real DOM.

4. **State Management**:
   - `useState`: Enables functional components to maintain internal state.

5. **Work Loop**:
   - `performUnitOfWork` and `workLoop`: Manage rendering work using idle browser time.

---

## Contributing

This project is for learning purposes. If you'd like to extend or refactor it, feel free to fork the repository or create a pull request!

---

## Acknowledgments

- Inspired by the React framework.
- Special thanks to the React documentation for providing insights into how React works internally.

---

## License

This project is open-source and available for personal and educational use. Feel free to modify it to suit your needs.
