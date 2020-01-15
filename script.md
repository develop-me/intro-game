# Workshop Script

- Make sure resources page is open: [developme.training/cf](developme.training/cf)
- Demo: [develop-me.github.io/intro-game/](develop-me.github.io/intro-game/)
- Demonstrate forking the template: [https://codepen.io/smallhadroncollider/pen/wvvaePq](https://codepen.io/smallhadroncollider/pen/wvvaePq)
- **Work from a fork!**

## Intro

- The tech
    - HTML & SVGs: for objects
    - CSS: for styling
    - JS: for interactivity
- Look at:
    - SVG: the player (line 27)
    - CSS: the score (line 12)
    - JS: collision detection (line 336)

## Graphics

- Coordinate system (diagram):
    - `x`: distance from left
    - `y`: distance from *top*
    - `z`: depth
- Show the various layers of the scene by editing `.intro` CSS (line 69)
- Repeating elements with JS (delete JS to see what happens)
- The scene `<div>` wraps the game, hides things (`overflow: visible`)
- Pixel vs Vector graphics
    - GIF, JPG, PNG: don't scale well, needed for photos - every pixel is unique
    - "Scalable Vector Graphic": infinite scaling, great for illustrations/logos
- Clouds
    - Draw a cloud from three circles
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
- Draw a diagram of two complex shapes
- Perfect collision detection impractical
- Draw bounding boxes
- When do things collide? When they overlap
- Draw diagram:
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
