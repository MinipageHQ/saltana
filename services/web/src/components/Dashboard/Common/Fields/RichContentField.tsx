import tw, { styled } from 'twin.macro'

import dynamic from 'next/dynamic'

const Editor = dynamic(() => import('../Editor/Editor'), {
  ssr: false,
})

export default function RichContentField({ register }) {
  return (
    <div tw="w-5/6">
      <Editor
        onRicosEditorChange={(e) => {
          console.log('onRicosEditorChange', e)
        }}
      />
    </div>
  )
}