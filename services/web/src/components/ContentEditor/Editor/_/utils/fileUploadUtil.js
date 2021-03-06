import { Helpers } from 'wix-rich-content-common'
import { testImages, testWixVideos } from './mock'

export const mockImageNativeUploadFunc = (files, updateEntity) => {
  const mockImageIndex = Math.floor(Math.random() * testImages.length)
  const testItem = testImages[mockImageIndex]
  const data = {
    id: testItem.photoId,
    original_file_name: files && files[0] ? files[0].name : testItem.url,
    file_name: testItem.url,
    width: testItem.metadata.width,
    height: testItem.metadata.height,
  }
  setTimeout(() => {
    updateEntity({ data, files })
    console.log('consumer uploaded', data)
  }, 2000)
}

export const mockImageUploadFunc = (
  index,
  multiple,
  updateEntity,
  removeEntity,
  componentData
) => {
  const shouldMultiSelectImages = false
  const count = componentData.items || shouldMultiSelectImages ? [1, 2, 3] : [1]
  const data = []
  count.forEach((_) => {
    const testItem = testImages[Math.floor(Math.random() * testImages.length)]
    data.push({
      id: testItem.photoId,
      original_file_name: testItem.url,
      file_name: testItem.url,
      width: testItem.metadata.width,
      height: testItem.metadata.height,
    })
  })
  setTimeout(() => {
    updateEntity({ data })
  }, 500)
}

export const mockFileNativeUploadFunc = (file, updateEntity) => {
  const { name } = file
  let type
  if (name && name.includes('.')) {
    type = name.split('.').pop()
  }
  const { size } = file

  const data = {
    name,
    type,
    url: 'https://www.w3.org/wai/er/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    size,
  }
  setTimeout(() => updateEntity({ data }), 5000)
}

export const mockFileUploadFunc = (updateEntity) => {
  const multiple = false
  const count = multiple ? [1, 2, 3] : [1]
  const data = []
  const filenames = ['image.jpg', 'document.pdf', 'music.mp3']
  count.forEach((_) => {
    const name = filenames[Math.floor(Math.random() * filenames.length)]
    let type
    if (name && name.includes('.')) {
      type = name.split('.').pop()
    }
    data.push({
      name,
      type,
      url: 'https://www.w3.org/wai/er/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      size: 150000,
    })
  })
  setTimeout(() => updateEntity({ data }), 500)
}

export const mockCustomVideoUploadFunc = (updateEntity, removeEntity) => {
  console.log('consumer wants to upload custom video')
  const videoToUpload = getVideoToUpload(
    '11062b_a552731f40854d16a91627687fb8d1a6',
    '11062b_a552731f40854d16a91627687fb8d1a6f000.jpg'
  )
  setTimeout(() => {
    updateEntity({ data: videoToUpload })
    console.log('consumer uploaded ', videoToUpload)
  }, 500)
}

export const mockVideoNativeUploadFunc = (file, updateEntity, removeEntity) => {
  console.log('consumer wants to upload custom video', file)
  const mockVideoIndex = Math.floor(Math.random() * testWixVideos.length)
  const testVideo = testWixVideos[mockVideoIndex]
  const videoToUpload = getVideoToUpload(
    testVideo.url,
    testVideo.metadata.posters[0].url
  )
  setTimeout(() => {
    updateEntity({ data: videoToUpload })
    console.log('consumer uploaded ', videoToUpload)
  }, 5000)
}

export const getVideoToUpload = (url, thumbnailUrl) => {
  const videoWithAbsoluteUrl = {
    url: 'https://video.wixstatic.com/video/11062b_a552731f40854d16a91627687fb8d1a6/1080p/mp4/file.mp4',
  }
  const videoWithRelativeUrl = {
    pathname: `video/${url}/1080p/mp4/file.mp4`,
    thumbnail: {
      pathname: `media/${thumbnailUrl}`,
      height: 1080,
      width: 1920,
    },
  }
  // You can provide either absolute or relative URL.
  // If relative URL is provided, a function 'getVideoUrl' will be invoked to form a full URL.
  return videoWithRelativeUrl
}

/// ///////////////////////////////////////FOR TESTS//////////////////////////////////////////

export const mockTestImageNativeUpload = (files, updateEntity) => {
  const shouldMultiSelectImages = false
  const count = files.length > 1 || shouldMultiSelectImages ? [1, 2, 3] : [1]
  const data = []
  let number = 0
  count.forEach((_) => {
    const testItem = testImages[number]
    data.push({
      id: testItem.photoId,
      original_file_name: testItem.url,
      file_name: testItem.url,
      width: testItem.metadata.width,
      height: testItem.metadata.height,
    })
    number++
  })
  setTimeout(() => {
    updateEntity({ data })
  }, 200)
}

export const mockTestImageUpload = (
  index,
  multiple,
  updateEntity,
  removeEntity,
  componentData
) => {
  const shouldMultiSelectImages = false
  const count = componentData.items || shouldMultiSelectImages ? [1, 2, 3] : [1]
  const data = []
  let number = 0
  count.forEach((_) => {
    const testItem = testImages[number]
    data.push({
      id: testItem.photoId,
      original_file_name: testItem.url,
      file_name: testItem.url,
      width: testItem.metadata.width,
      height: testItem.metadata.height,
    })
    number++
  })
  setTimeout(() => {
    updateEntity({ data })
  }, 200)
}

export const mockTestFileNativeUpload = (_file, updateEntity) => {
  const name = 'music.mp3'
  const filenameParts = name.split('.')
  const type = filenameParts[filenameParts.length - 1]

  const file = {
    name,
    type,
    url: 'https://www.w3.org/wai/er/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  }

  setTimeout(() => {
    updateEntity({ data: file })
  }, 200)
}

export const mockTestFileUpload = (updateEntity) => {
  const data = []
  const name = 'music.mp3'
  const filenameParts = name.split('.')
  const type = filenameParts[filenameParts.length - 1]

  data.push({
    name,
    type,
    url: 'https://www.w3.org/wai/er/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  })

  setTimeout(() => updateEntity({ data }), 200)
}

/// ///////////////////////////////////////FOR TESTS//////////////////////////////////////////
