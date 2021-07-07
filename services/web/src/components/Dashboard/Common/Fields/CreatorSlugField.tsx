import 'twin.macro'

export default function CreatorSlugField({ register, username }) {
  return (
    <>
      <label htmlFor="link.slug" tw="block text-sm font-medium text-gray-700">
        Link
      </label>
      <div tw="mt-1 sm:mt-0 sm:col-span-2">
        <div tw="max-w-lg flex rounded-md shadow-sm">
          <span tw="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300  text-gray-500 sm:text-sm">
            saltana.com/{username}/
          </span>
          <input
            type="text"
            id="link.slug"
            {...register('link.slug', {
              required: true,
            })}
            autoComplete="slug"
            tw="flex-1 block w-full focus:ring-indigo-500 focus:border-indigo-500 min-w-0 rounded-none rounded-r-md sm:text-sm border-gray-300"
          />
        </div>
      </div>
    </>
  )
}
