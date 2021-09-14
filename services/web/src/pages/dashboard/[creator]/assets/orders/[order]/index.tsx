import * as React from 'react'
import DashboardShell from 'components/Dashboard/Common/Shell'
import tw from 'twin.macro'
import { NextSeo } from 'next-seo'
import { CalendarIcon, ChevronRightIcon } from '@heroicons/react/solid'
import getServerSidePropsForCreatorDashboardPages from '@/server/getServerSidePropsForCreatorDashboardPages'
import useApi from 'hooks/useApi'
import useCurrentUser from 'hooks/useCurrentUser'
import { CreatorDashboardAssetsLink } from 'components/Links'
import useCreatorSpace from 'hooks/useCreatorSpace'

const products = [
  {
    id: 1,
    name: 'Nomad Tumbler',
    description:
      'This durable and portable insulated tumbler will keep your beverage at the perfect temperature during your next adventure.',
    href: '#',
    price: '35.00',
    status: 'Preparing to ship',
    step: 1,
    date: 'March 24, 2021',
    datetime: '2021-03-24',
    address: ['Floyd Miles', '7363 Cynthia Pass', 'Toronto, ON N3Y 4H8'],
    email: 'f•••@example.com',
    phone: '1•••••••••40',
    imageSrc:
      'https://tailwindui.com/img/ecommerce-images/confirmation-page-03-product-01.jpg',
    imageAlt: 'Insulated bottle with white base and black snap lid.',
  },
  {
    id: 2,
    name: 'Minimalist Wristwatch',
    description:
      'This contemporary wristwatch has a clean, minimalist look and high quality components.',
    href: '#',
    price: '149.00',
    status: 'Shipped',
    step: 0,
    date: 'March 23, 2021',
    datetime: '2021-03-23',
    address: ['Floyd Miles', '7363 Cynthia Pass', 'Toronto, ON N3Y 4H8'],
    email: 'f•••@example.com',
    phone: '1•••••••••40',
    imageSrc:
      'https://tailwindui.com/img/ecommerce-images/confirmation-page-03-product-02.jpg',
    imageAlt:
      'Arm modeling wristwatch with black leather band, white watch face, thin watch hands, and fine time markings.',
  },
  // More products...
]

function OrderView({ order }) {
  return (
    <div tw="bg-gray-50">
      <div tw="max-w-2xl mx-auto pt-16 sm:py-24 sm:px-6 lg:max-w-7xl lg:px-8">
        <div tw="px-4 space-y-2 sm:px-0 sm:flex sm:items-baseline sm:justify-between sm:space-y-0">
          <div tw="flex sm:items-baseline sm:space-x-4">
            <h1 tw="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              Order #54879
            </h1>
            <a
              href="#"
              tw="hidden text-sm font-medium text-indigo-600 hover:text-indigo-500 sm:block"
            >
              View invoice<span aria-hidden="true"> &rarr;</span>
            </a>
          </div>
          <p tw="text-sm text-gray-600">
            Order placed{' '}
            <time dateTime="2021-03-22" tw="font-medium text-gray-900">
              March 22, 2021
            </time>
          </p>
          <a
            href="#"
            tw="text-sm font-medium text-indigo-600 hover:text-indigo-500 sm:hidden"
          >
            View invoice<span aria-hidden="true"> &rarr;</span>
          </a>
        </div>

        {/* Products */}
        <div tw="mt-6">
          <h2 tw="sr-only">Products purchased</h2>

          <div tw="space-y-8">
            {products.map((product) => (
              <div
                key={product.id}
                tw="bg-white border-t border-b border-gray-200 shadow-sm sm:border sm:rounded-lg"
              >
                <div tw="py-6 px-4 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-x-8 lg:p-8">
                  <div tw="sm:flex lg:col-span-7">
                    <div tw="flex-shrink-0 w-full aspect-w-1 aspect-h-1 rounded-lg overflow-hidden sm:aspect-none sm:w-40 sm:h-40">
                      <img
                        src={product.imageSrc}
                        alt={product.imageAlt}
                        tw="w-full h-full object-center object-cover sm:w-full sm:h-full"
                      />
                    </div>

                    <div tw="mt-6 sm:mt-0 sm:ml-6">
                      <h3 tw="text-base font-medium text-gray-900">
                        <a href={product.href}>{product.name}</a>
                      </h3>
                      <p tw="mt-2 text-sm font-medium text-gray-900">
                        ${product.price}
                      </p>
                      <p tw="mt-3 text-sm text-gray-500">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  <div tw="mt-6 lg:mt-0 lg:col-span-5">
                    <dl tw="grid grid-cols-2 gap-x-6 text-sm">
                      <div>
                        <dt tw="font-medium text-gray-900">Delivery address</dt>
                        <dd tw="mt-3 text-gray-500">
                          <span tw="block">{product.address[0]}</span>
                          <span tw="block">{product.address[1]}</span>
                          <span tw="block">{product.address[2]}</span>
                        </dd>
                      </div>
                      <div>
                        <dt tw="font-medium text-gray-900">Shipping updates</dt>
                        <dd tw="mt-3 text-gray-500 space-y-3">
                          <p>{product.email}</p>
                          <p>{product.phone}</p>
                          <button
                            type="button"
                            tw="font-medium text-indigo-600 hover:text-indigo-500"
                          >
                            Edit
                          </button>
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div tw="border-t border-gray-200 py-6 px-4 sm:px-6 lg:p-8">
                  <h4 tw="sr-only">Status</h4>
                  <p tw="text-sm font-medium text-gray-900">
                    {product.status} on{' '}
                    <time dateTime={product.datetime}>{product.date}</time>
                  </p>
                  <div tw="mt-6" aria-hidden="true">
                    <div tw="bg-gray-200 rounded-full overflow-hidden">
                      <div
                        tw="h-2 bg-indigo-600 rounded-full"
                        style={{
                          width: `calc((${product.step} * 2 + 1) / 8 * 100%)`,
                        }}
                      />
                    </div>
                    <div tw="hidden sm:grid grid-cols-4 text-sm font-medium text-gray-600 mt-6">
                      <div tw="text-indigo-600">Order placed</div>
                      <div
                        css={[
                          product.step > 0 ? tw`text-indigo-600` : '',
                          tw`text-center`,
                        ]}
                      >
                        Processing
                      </div>
                      <div
                        css={[
                          product.step > 1 ? tw`text-indigo-600` : '',
                          tw`text-center`,
                        ]}
                      >
                        Shipped
                      </div>
                      <div
                        css={[
                          product.step > 2 ? tw`text-indigo-600` : '',
                          tw`text-right`,
                        ]}
                      >
                        Delivered
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Billing */}
        <div tw="mt-16">
          <h2 tw="sr-only">Billing Summary</h2>

          <div tw="bg-gray-100 py-6 px-4 sm:px-6 sm:rounded-lg lg:px-8 lg:py-8 lg:grid lg:grid-cols-12 lg:gap-x-8">
            <dl tw="grid grid-cols-2 gap-6 text-sm sm:grid-cols-2 md:gap-x-8 lg:col-span-7">
              <div>
                <dt tw="font-medium text-gray-900">Billing address</dt>
                <dd tw="mt-3 text-gray-500">
                  <span tw="block">Floyd Miles</span>
                  <span tw="block">7363 Cynthia Pass</span>
                  <span tw="block">Toronto, ON N3Y 4H8</span>
                </dd>
              </div>
              <div>
                <dt tw="font-medium text-gray-900">Payment information</dt>
                <div tw="mt-3">
                  <dd tw="-ml-4 -mt-4 flex flex-wrap">
                    <div tw="ml-4 mt-4 flex-shrink-0">
                      <svg
                        aria-hidden="true"
                        width={36}
                        height={24}
                        viewBox="0 0 36 24"
                        xmlns="http://www.w3.org/2000/svg"
                        tw="h-6 w-auto"
                      >
                        <rect width={36} height={24} rx={4} fill="#224DBA" />
                        <path
                          d="M10.925 15.673H8.874l-1.538-6c-.073-.276-.228-.52-.456-.635A6.575 6.575 0 005 8.403v-.231h3.304c.456 0 .798.347.855.75l.798 4.328 2.05-5.078h1.994l-3.076 7.5zm4.216 0h-1.937L14.8 8.172h1.937l-1.595 7.5zm4.101-5.422c.057-.404.399-.635.798-.635a3.54 3.54 0 011.88.346l.342-1.615A4.808 4.808 0 0020.496 8c-1.88 0-3.248 1.039-3.248 2.481 0 1.097.969 1.673 1.653 2.02.74.346 1.025.577.968.923 0 .519-.57.75-1.139.75a4.795 4.795 0 01-1.994-.462l-.342 1.616a5.48 5.48 0 002.108.404c2.108.057 3.418-.981 3.418-2.539 0-1.962-2.678-2.077-2.678-2.942zm9.457 5.422L27.16 8.172h-1.652a.858.858 0 00-.798.577l-2.848 6.924h1.994l.398-1.096h2.45l.228 1.096h1.766zm-2.905-5.482l.57 2.827h-1.596l1.026-2.827z"
                          fill="#fff"
                        />
                      </svg>
                      <p tw="sr-only">Visa</p>
                    </div>
                    <div tw="ml-4 mt-4">
                      <p tw="text-gray-900">Ending with 4242</p>
                      <p tw="text-gray-600">Expires 02 / 24</p>
                    </div>
                  </dd>
                </div>
              </div>
            </dl>

            <dl tw="mt-8 divide-y divide-gray-200 text-sm lg:mt-0 lg:col-span-5">
              <div tw="pb-4 flex items-center justify-between">
                <dt tw="text-gray-600">Subtotal</dt>
                <dd tw="font-medium text-gray-900">$72</dd>
              </div>
              <div tw="py-4 flex items-center justify-between">
                <dt tw="text-gray-600">Shipping</dt>
                <dd tw="font-medium text-gray-900">$5</dd>
              </div>
              <div tw="py-4 flex items-center justify-between">
                <dt tw="text-gray-600">Tax</dt>
                <dd tw="font-medium text-gray-900">$6.16</dd>
              </div>
              <div tw="pt-4 flex items-center justify-between">
                <dt tw="font-medium text-gray-900">Order total</dt>
                <dd tw="font-medium text-indigo-600">$83.16</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

export const CreatorDashboardOrderView = () => {
  const user = useCurrentUser()
  const { link, creator, order, isLink, isLoading } = useCreatorSpace()

  return (
    <DashboardShell>
      <NextSeo title="Order #8898" />
      <div tw="md:flex md:items-center md:justify-between">
        <div tw="flex-1 min-w-0">
          <h2 tw="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Assets
          </h2>
        </div>
        <div tw="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            tw="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add Product
          </button>
        </div>
      </div>
      {order.data ? <OrderView order={order.data} /> : 'No order :('}
    </DashboardShell>
  )
}

export const getServerSideProps = getServerSidePropsForCreatorDashboardPages()

export default CreatorDashboardOrderView