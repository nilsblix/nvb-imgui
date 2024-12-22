import { REND, N, WidgetLoc, Cursor, BBox, MBBox, MColor, Widget, GlobalStyle, InputState } from "./basics.ts";

const enum TextState {
  default,
  hovered,
}

export class Text<ActionType> implements Widget<ActionType> {
  bbox: BBox;
  action_type: ActionType;
  loc: WidgetLoc;
  widgets: Widget<ActionType>[];
  text: string;
  text_size: number;
  max_width: number; // New property for text wrapping
  state: TextState;
  wrapped_lines: string[]; // Stores wrapped lines of text

  constructor(c: REND, action_type: ActionType, loc: WidgetLoc, cursor: Cursor, text: string, max_width: number) {
    c.font = GlobalStyle.label.font_size + "px " + GlobalStyle.font;
    c.textBaseline = "middle";

    this.max_width = max_width;
    this.text = text;
    this.action_type = action_type;
    this.text_size = GlobalStyle.label.font_size;
    this.state = TextState.default;
    this.loc = loc;
    this.widgets = [];

    // Calculate wrapped lines
    this.wrapped_lines = this.wrapText(c, text, max_width);

    // Calculate bounding box based on wrapped lines
    const line_height = this.text_size * 1.2; // Adjust line height as needed
    const height = this.wrapped_lines.length * line_height;
    const width = max_width;
    this.bbox = { left: cursor.x, top: cursor.y, right: cursor.x + width, bottom: cursor.y + height };
  }

  // Method to wrap text into lines
  wrapText(c: REND, text: string, max_width: number): string[] {
    const words = text.split(" ");
    const lines: string[] = [];
    let current_line = "";

    for (let word of words) {
      const test_line = current_line + (current_line ? " " : "") + word;
      const metrics = c.measureText(test_line);
      if (metrics.width > max_width) {
        if (current_line) lines.push(current_line);
        current_line = word;
      } else {
        current_line = test_line;
      }
    }

    if (current_line) lines.push(current_line);
    return lines;
  }

  render(c: REND): void {
    let color = MColor.string(MColor.white);
    if (this.state == TextState.hovered) color = GlobalStyle.widget.hover_bg_color;

    c.font = this.text_size + "px " + GlobalStyle.font;
    c.fillStyle = color;
    c.textBaseline = "middle";
    c.textAlign = "left"; // Align text to the left

    const line_height = this.text_size * 1.2; // Adjust line height as needed
    let y = this.bbox.top + line_height / 2 - 0.25 * this.text_size;

    for (let line of this.wrapped_lines) {
      const x = this.bbox.left; // Start text at the left edge of the bounding box
      c.fillText(line, x, y);
      y += line_height;
    }

    // c.strokeStyle = MColor.string(MColor.white);
    // c.strokeRect(this.bbox.left, this.bbox.top, MBBox.calcWidth(this.bbox), MBBox.calcHeight(this.bbox));
  }

  requestAction(input_state: InputState): { wants_focus: boolean, action: N<ActionType> } {
    if (this.action_type == null) return { wants_focus: false, action: null };

    const [x, y] = [input_state.mouse_position.x, input_state.mouse_position.y];

    if (MBBox.isInside(this.bbox, x, y) && this.action_type != null) {
      this.state = TextState.hovered;
      input_state.active_widget_loc = this.loc;
    }

    if (this.state == TextState.hovered) {
      return { wants_focus: false, action: this.action_type };
    }

    for (let widget of this.widgets) {
      const ret = widget.requestAction(input_state);
      if (ret.wants_focus || ret.action != null) return ret;
    }

    return { wants_focus: false, action: null };
  }
}
