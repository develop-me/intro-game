# Coding Fellowship Taster Workshop


## SVG (Scalable Vector Graphics)

### Clouds

Copy the code below and think of sensible values in place of the question marks.

```svg
<circle cx="188" cy="120" r="?"/>
<circle cx="208" cy="?" r="24"/>
<circle cx="?" cy="115" r="19"/>
```

Remember the cloud area is 250×200. If you're not sure where to start then just try some numbers and see what happens!


### Obstacles

[Online SVG Editor](https://editor.method.ac)

**Before you start**:

- Set height to `100`
- Set width to `100`
- Set color to transparent

Once you're happy with it:

- View -> Source... (Ctrl/Cmd + U)


## CSS (Cascading Style Sheets)

In the `.scene` section:

```css
background-image: linear-gradient(#335157, #378E83 300px, #575756 300px);
```

- [MDN: Linear Gradients](https://developer.mozilla.org/en-US/docs/Web/CSS/linear-gradient)
- [MDN: Radial Gradients](https://developer.mozilla.org/en-US/docs/Web/CSS/radial-gradient)


## JS (JavaScript)

Lines 64-68:

```js
const collision = (a, b) => (
    a.left < b.right &&
    a.right > b.left &&
    a.top < b.bottom &&
    a.bottom > b.top
);
```
