const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const {
  createCanvas,
  loadImage
} = require('canvas')

//  First things first we need to read in the images from the directory
if (process.argv.length <= 2) {
  console.log('You need to pass in the directory you want to have processed.')
  process.exit()
}

//  Check the path exists
if (!fs.existsSync(process.argv[2])) {
  console.log('That directory doesn\'t exist')
  process.exit()
}

//  Grab the images
const imageDir = process.argv[2]
const images = fs.readdirSync(imageDir).filter((f) => {
  const imageSplit = f.split('.')
  const extension = imageSplit.pop()
  if (['png', 'jpg', 'jpeg'].includes(extension)) return true
  return false
})

//  If there aren't any images, then we bail out here
if (images.length === 0) {
  console.log('There are no images in that directory')
  process.exit()
}

//  Now we want to work out what factors there could be
const found = []
const options = []
for (let x = 1; x <= images.length; x++) {
  const y = images.length / x
  if (images.length % x === 0 && !found.includes(x) && !found.includes(y)) {
    options.push(`${x}x${y}`)
    found.push(x)
    if (y !== x) found.push(y)
  }
}
console.log()
console.log('Possible factors are: ', options.join(', '))
console.log()

inquirer
  .prompt([
    /* Pass your questions in here */
    {
      type: Number,
      name: 'across',
      message: 'How many tiles across should we have?'
    },
    {
      type: Number,
      name: 'width',
      message: 'Final image width'
    }
  ])
  .then((answers) => {
    const across = answers.across
    const down = Math.ceil(images.length / parseInt(across, 10))
    const width = parseInt(answers.width, 10)
    const widthPerImage = width / across
    const height = Math.floor(widthPerImage * down)

    console.log()
    console.log(`Final image will be ${width} by ${height}`)
    console.log(`Images will be ${widthPerImage.toFixed(2)} by ${(height / down).toFixed(2)}`)
    console.log()

    inquirer
      .prompt([{
        type: 'confirm',
        name: 'carryOn',
        message: 'Shall we carry on?'
      }]).then((answers) => {
        if (answers.carryOn) {
          console.log()
          processImage(images, parseInt(across, 10), down, width, height)
        } else {
          console.log()
          process.exit()
        }
      })
      .catch((error) => {
        if (error.isTtyError) {
          // Prompt couldn't be rendered in the current environment
        } else {
          // Something else went wrong
        }
      })
  })
  .catch((error) => {
    if (error.isTtyError) {
      // Prompt couldn't be rendered in the current environment
    } else {
      // Something else went wrong
    }
  })

const processImage = async (images, across, down, width, height) => {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  const tileWidth = width / across
  const tileHeight = height / down
  let x = 0
  let y = 0

  for (const image of images) {
    console.log(`Loading: ${y * across + x + 1} of ${images.length}`)
    const tileImage = await loadImage(path.join(imageDir, image))
    ctx.drawImage(tileImage, x * tileWidth, y * tileHeight, tileWidth, tileHeight)
    // Move onto the next tile
    x++
    if (x >= across) {
      y++
      x = 0
    }
  }

  const outPNG = fs.createWriteStream(path.join(imageDir, 'tiled.png'))
  const streamPNG = canvas.createPNGStream()
  streamPNG.pipe(outPNG)
  outPNG.on('finish', () => console.log('PNG file created'))

  const outJPG = fs.createWriteStream(path.join(imageDir, 'tiled.jpg'))
  const streamJPG = canvas.createJPEGStream()
  streamJPG.pipe(outJPG)
  outJPG.on('finish', () => console.log('JPG file created'))
}
