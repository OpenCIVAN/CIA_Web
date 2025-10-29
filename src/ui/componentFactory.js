// ----------------------------------------------------------------------------
// UI Component Factory - DRY utilities for building UI components
// ----------------------------------------------------------------------------

/**
 * Creates a table row with a single cell
 */
export function createRow() {
  const row = document.createElement("tr");
  const cell = document.createElement("td");
  row.appendChild(cell);
  return { row, cell };
}

/**
 * Creates a button with consistent styling
 */
export function createButton(text, options = {}) {
  const button = document.createElement("button");
  button.textContent = text;
  
  const {
    variant = "primary", // primary, secondary, danger, warning
    fullWidth = true,
    onClick = null,
    className = "",
    id = "",
  } = options;

  // Base styles (overridden by control-panel styles)
  if (fullWidth) {
    button.style.width = "100%";
  }

  // Apply variant styling
  const variantStyles = {
    primary: { background: "#4CAF50" },
    secondary: { background: "#2196F3" },
    danger: { background: "#f44336" },
    warning: { background: "#ff9800" },
  };

  if (variantStyles[variant]) {
    Object.assign(button.style, variantStyles[variant]);
  }

  if (className) button.className = className;
  if (id) button.id = id;
  if (onClick) button.addEventListener("click", onClick);

  return button;
}

/**
 * Creates a select dropdown with options
 */
export function createSelect(options, selectedValue = null, onChange = null) {
  const select = document.createElement("select");
  select.style.width = "100%";

  options.forEach(({ value, text }) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = text;
    if (value === selectedValue) {
      option.selected = true;
    }
    select.appendChild(option);
  });

  if (onChange) {
    select.addEventListener("change", onChange);
  }

  return select;
}

/**
 * Creates an input field
 */
export function createInput(options = {}) {
  const {
    type = "text",
    placeholder = "",
    value = "",
    id = "",
    className = "",
    onChange = null,
    onEnter = null,
  } = options;

  const input = document.createElement("input");
  input.type = type;
  if (placeholder) input.placeholder = placeholder;
  if (value) input.value = value;
  if (id) input.id = id;
  if (className) input.className = className;

  if (onChange) {
    input.addEventListener("change", onChange);
  }

  if (onEnter) {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        onEnter(e);
      }
    });
  }

  return input;
}

/**
 * Creates an input + button group (like username or chat input)
 */
export function createInputButtonGroup(inputOptions, buttonText, onSubmit) {
  const container = document.createElement("div");
  container.className = "input-button-group";
  container.style.cssText = `
    display: flex;
    gap: 8px;
    align-items: center;
  `;

  const input = createInput({
    ...inputOptions,
    onEnter: () => onSubmit(input.value),
  });
  input.style.cssText = `
    flex: 1;
    min-width: 0;
  `;

  const button = createButton(buttonText, {
    fullWidth: false,
    onClick: () => onSubmit(input.value),
  });
  button.style.cssText += `
    flex-shrink: 0;
    width: auto;
    white-space: nowrap;
  `;

  container.appendChild(input);
  container.appendChild(button);

  return { container, input, button };
}

/**
 * Creates a scrollable message/list container
 */
export function createScrollableList(options = {}) {
  const {
    id = "",
    maxHeight = "150px",
    className = "",
  } = options;

  const container = document.createElement("div");
  if (id) container.id = id;
  if (className) container.className = className;

  container.style.cssText = `
    max-height: ${maxHeight};
    overflow-y: auto;
    border: 1px solid #ddd;
    padding: 8px;
    margin: 8px 0;
    background: #f9f9f9;
    border-radius: 4px;
    font-size: 12px;
  `;

  return container;
}

/**
 * Creates a label
 */
export function createLabel(text, options = {}) {
  const { htmlFor = "", bold = false, style = "" } = options;

  const label = document.createElement("label");
  label.textContent = text;
  if (htmlFor) label.htmlFor = htmlFor;
  if (bold) label.style.fontWeight = "bold";
  if (style) label.style.cssText += style;

  return label;
}

/**
 * Adds a row with a single button to a table
 */
export function addButtonRow(table, text, onClick, options = {}) {
  const { row, cell } = createRow();
  const button = createButton(text, { onClick, ...options });
  cell.appendChild(button);
  table.appendChild(row);
  return { row, button };
}

/**
 * Adds a row with a select dropdown to a table
 */
export function addSelectRow(table, selectOptions, selectedValue, onChange, options = {}) {
  const { row, cell } = createRow();
  const select = createSelect(selectOptions, selectedValue, onChange);
  cell.appendChild(select);
  table.appendChild(row);
  return { row, select };
}

/**
 * Adds a row with an input + button group to a table
 */
export function addInputButtonRow(table, inputOptions, buttonText, onSubmit) {
  const { row, cell } = createRow();
  const { container, input, button } = createInputButtonGroup(
    inputOptions,
    buttonText,
    onSubmit
  );
  cell.appendChild(container);
  table.appendChild(row);
  return { row, input, button };
}

/**
 * Adds a row with custom content to a table
 */
export function addCustomRow(table, content) {
  const { row, cell } = createRow();
  if (typeof content === "string") {
    cell.innerHTML = content;
  } else {
    cell.appendChild(content);
  }
  table.appendChild(row);
  return { row, cell };
}

/**
 * Creates a flex container with multiple items
 */
export function createFlexContainer(items, options = {}) {
  const {
    gap = "8px",
    direction = "row",
    align = "center",
    justify = "flex-start",
  } = options;

  const container = document.createElement("div");
  container.style.cssText = `
    display: flex;
    flex-direction: ${direction};
    gap: ${gap};
    align-items: ${align};
    justify-content: ${justify};
  `;

  items.forEach((item) => container.appendChild(item));

  return container;
}

/**
 * Creates a section header for panels
 */
export function createSectionHeader(text, options = {}) {
  const { icon = "", color = "#333" } = options;

  const header = document.createElement("h4");
  header.textContent = icon ? `${icon} ${text}` : text;
  header.style.cssText = `
    margin: 15px 0 8px 0;
    padding-bottom: 5px;
    border-bottom: 1px solid #ddd;
    color: ${color};
    font-size: 13px;
    text-transform: uppercase;
    font-weight: 600;
  `;

  return header;
}