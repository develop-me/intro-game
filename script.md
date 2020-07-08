# Workshop Script

- [Slides](https://docs.google.com/presentation/d/1scHVUz-JNkDgcf9ZQ39wUlkf2JneH69oYjXM_h2J4F0/edit)

- **Pin screen if can't see code**
- Make sure resources page is open: [developme.tech/cf](https://developme.tech/cf)
- Demo: [develop-me.github.io/intro-game/](https://develop-me.github.io/intro-game/)
- Demonstrate forking the template: [codepen.io/developmark/pen/JjGvXjY](https://codepen.io/developmark/pen/JjGvXjY)
- **Work from a fork!**

## Intro

- The tech
    - HTML & SVGs: for objects - the player (line 27)
    - CSS: for styling - the score (line 12)
    - JS: for interactivity - collision detection (line 336)

## Graphics

- **Slide**: Coordinate system
    - `x`: distance from left
    - `y`: distance from *top*
    - `z`: depth
- **Slide**: Show the various layers of the scene by editing `.intro` CSS (line 69)
- **Slide**: Repeating elements with JS (delete JS to see what happens)
- **Slide**: The scene `<div>` wraps the game, hides things (`overflow: visible`)
- **Slide**: Pixel vs Vector graphics
    - GIF, JPG, PNG: don't scale well, needed for photos - every pixel is unique
    - "Scalable Vector Graphic": infinite scaling, great for illustrations/logos
- Clouds
    - **Slide**: Draw a cloud from three circles
    - Look at the `viewbox`: the canvas size
    - One `<g>` (group) per cloud
    - Three `<circle>` per cloud
    - Varied x, y positions
    - Needs class `cloud` for CSS styling
    - Copy in cloud code from snippet repo
    - **Exercise**
- Obstacles
    - Show obstacle in final game
    - [https://editor.method.ac](https://editor.method.ac)
    - Steps:
        - Width: 100
        - Height: 100
        - Color: transparent
        - Draw
        - View -> Source (Ctrl/Cmd + U)
    - Remove gumpf
    - **Exercise**

## Styling

- Background a bit boring
- Copy from snippets: `background-image: linear-gradient(#335157, #378E83 300px, #575756 300px);`
- **Exercise**

## Interaction

- Game very easy
- Need to add collision detection (line 64)
- Collision detection function called 60 times a second for every obstacle
- Gets the position of each obstacle and the position of the player
- Have they collided?
- **Slide**: Draw a diagram of two complex shapes
- **Slide**: Perfect collision detection impractical
- **Slide**: Draw bounding boxes
- **Slide**: When do things collide? When they overlap
- **Slide**: Draw diagram:
    - a’s left is less than b’s right
    - a’s right is greater than b’s left
    - a’s top is less than b’s bottom
    - a’s bottom is greater than b’s top
- Copy code snippet:

    ```js
    const collision = (a, b) => (
        a.left < b.right &&
        a.right > b.left &&
        a.top < b.bottom &&
        a.bottom > b.top
    );
    ```
- **Exercise**

## End

- Encourage to play at home
