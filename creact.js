// createElement: Creates a virtual DOM element with the specified type, properties, and children.
function createElement(type, props, ...children) {
  return {
    type, // The type of element (e.g., "div", "span", or a custom component).
    props: {
      ...props, // Spread all properties provided.
      children: children.map(child =>
        // If the child is an object (e.g., another element), keep it as is.
        // Otherwise, wrap it in a text element for rendering text nodes.
        typeof child === "object" ? child : createTextElement(child)
      ),
    },
  }
}

// createTextElement: Creates a virtual DOM node specifically for text content.
function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT", // Special type for text nodes.
    props: {
      nodeValue: text, // Text content.
      children: [], // Text nodes have no children.
    },
  }
}

// createDom: Converts a fiber node into an actual DOM node.
function createDom(fiber) {
  // Create a text node or a regular DOM element based on the fiber's type.
  const dom =
    fiber.type == "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type)

  // Set initial properties and event listeners for the DOM node.
  updateDom(dom, {}, fiber.props)

  return dom
}

// Helper functions to filter properties/events for DOM updates.
const isEvent = key => key.startsWith("on") // Event listeners start with "on".
const isProperty = key => key !== "children" && !isEvent(key) // Regular properties, excluding children.
const isNew = (prev, next) => key => prev[key] !== next[key] // New/changed properties.
const isGone = (prev, next) => key => !(key in next) // Removed properties.

// updateDom: Updates a DOM node by applying changes to its properties and event listeners.
function updateDom(dom, prevProps, nextProps) {
  // Remove old or changed event listeners.
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      key => !(key in nextProps) || isNew(prevProps, nextProps)(key)
    )
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2) // Extract event type (e.g., "click").
      dom.removeEventListener(eventType, prevProps[name])
    })

  // Remove old properties that no longer exist.
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = ""
    })

  // Add or update new properties.
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      dom[name] = nextProps[name]
    })

  // Add new event listeners.
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name.toLowerCase().substring(2)
      dom.addEventListener(eventType, nextProps[name])
    })
}

// commitRoot: Commits all changes (additions, updates, deletions) to the DOM.
function commitRoot() {
  deletions.forEach(commitWork) // Process deletions.
  commitWork(wipRoot.child) // Process all work starting with the root's child.
  currentRoot = wipRoot // Set the current root for the next render cycle.
  wipRoot = null // Clear the work-in-progress root.
}

// commitWork: Applies changes for a specific fiber node and its children/siblings.
function commitWork(fiber) {
  if (!fiber) {
    return
  }

  // Find the parent DOM node for this fiber.
  let domParentFiber = fiber.parent
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.dom

  // Handle different effect tags for placement, updates, and deletions.
  if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
    domParent.appendChild(fiber.dom)
  } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props)
  } else if (fiber.effectTag === "DELETION") {
    commitDeletion(fiber, domParent)
  }

  // Recursively commit work for children and siblings.
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

// commitDeletion: Removes a DOM node or recursively processes its children.
function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom)
  } else {
    commitDeletion(fiber.child, domParent)
  }
}

// render: Initializes the rendering process by creating the root fiber.
function render(element, container) {
  wipRoot = {
    dom: container, // Reference to the container DOM element.
    props: {
      children: [element], // The element to render.
    },
    alternate: currentRoot, // Reference to the previous root for reconciliation.
  }
  deletions = [] // Track nodes to delete.
  nextUnitOfWork = wipRoot // Start the work loop with the root fiber.
}

// Variables for managing the work loop.
let nextUnitOfWork = null // The next fiber to process.
let currentRoot = null // The current root fiber.
let wipRoot = null // The work-in-progress root fiber.
let deletions = null // List of fibers to delete.

// workLoop: Processes fibers during idle time.
function workLoop(deadline) {
  let shouldYield = false // Stop processing if there's no more time.
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork) // Perform work on the current fiber.
    shouldYield = deadline.timeRemaining() < 1 // Yield if the browser needs time.
  }

  if (!nextUnitOfWork && wipRoot) {
    commitRoot() // Commit changes once all work is done.
  }

  requestIdleCallback(workLoop) // Continue the loop during the next idle time.
}

requestIdleCallback(workLoop) // Start the work loop.

// performUnitOfWork: Performs the work for a single fiber.
function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function
  if (isFunctionComponent) {
    updateFunctionComponent(fiber)
  } else {
    updateHostComponent(fiber)
  }

  // Return the next fiber to process.
  if (fiber.child) {
    return fiber.child
  }
  let nextFiber = fiber
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
}

// Hook state management for function components.
let wipFiber = null // The work-in-progress fiber for hooks.
let hookIndex = null // The current hook index.

// updateFunctionComponent: Updates a functional component's fiber.
function updateFunctionComponent(fiber) {
  wipFiber = fiber
  hookIndex = 0
  wipFiber.hooks = []
  const children = [fiber.type(fiber.props)] // Invoke the component function.
  reconcileChildren(fiber, children) // Reconcile its children.
}

// useState: A simple hook to manage state in function components.
function useState(initial) {
  const oldHook =
    wipFiber.alternate &&
    wipFiber.alternate.hooks &&
    wipFiber.alternate.hooks[hookIndex]
  const hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  }

  const actions = oldHook ? oldHook.queue : []
  actions.forEach(action => {
    hook.state = action(hook.state) // Apply queued actions.
  })

  const setState = action => {
    hook.queue.push(action)
    wipRoot = {
      dom: currentRoot.dom,
      props: currentRoot.props,
      alternate: currentRoot,
    }
    nextUnitOfWork = wipRoot // Trigger a new render cycle.
    deletions = []
  }

  wipFiber.hooks.push(hook) // Save the hook in the fiber.
  hookIndex++
  return [hook.state, setState]
}

// updateHostComponent: Updates a regular DOM component's fiber.
function updateHostComponent(fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber) // Create the DOM node if it doesn't exist.
  }
  reconcileChildren(fiber, fiber.props.children) // Reconcile its children.
}

// reconcileChildren: Updates the fiber tree for the children of a given fiber.
function reconcileChildren(wipFiber, elements) {
  let index = 0
  let oldFiber = wipFiber.alternate && wipFiber.alternate.child
  let prevSibling = null

  while (index < elements.length || oldFiber != null) {
    const element = elements[index]
    let newFiber = null

    const sameType = oldFiber && element && element.type == oldFiber.type

    if (sameType) {
      // Update the existing fiber.
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: "UPDATE",
      }
    }
    if (element && !sameType) {
      // Create a new fiber for a new element type.
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null, // No DOM node yet; it will be created later.
        parent: wipFiber, // Reference to the parent fiber.
        alternate: null, // No alternate fiber since it's new.
        effectTag: "PLACEMENT", // Mark for placement (new node).
      }
    }
    if (oldFiber && !sameType) {
      // Mark the old fiber for deletion.
      oldFiber.effectTag = "DELETION"
      deletions.push(oldFiber) // Add to the list of nodes to delete.
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling // Move to the next sibling in the old fiber tree.
    }

    if (index === 0) {
      wipFiber.child = newFiber // Assign the first child.
    } else if (element) {
      prevSibling.sibling = newFiber // Link the new fiber as a sibling.
    }

    prevSibling = newFiber // Update the previous sibling reference.
    index++
  }
}

// The Creact object encapsulates the core API for this library.
const Creact = {
  createElement, // Function to create virtual DOM elements.
  render, // Function to render a virtual DOM tree into a real DOM.
  useState, // Hook for managing state in functional components.
}

/** @jsx Creact.createElement */
// Counter component: A functional component that uses the `useState` hook.
function Counter() {
  const [state, setState] = Creact.useState(1) // Initialize state with 1.
  return (
    <h1 onClick={() => setState(c => c + 1)}>
      Count: {state} {/* Render the current state. */}
    </h1>
  )
}

const element = <Counter /> // Create an instance of the Counter component.
const container = document.getElementById("root") // Get the root container in the DOM.
Creact.render(element, container) // Render the Counter component into the DOM.
