import * as React from 'react'
import DashboardShell from 'components/Dashboard/Common/Shell'
import { NextSeo } from 'next-seo'
import { GetServerSideProps } from 'next'

import {
  ArrowNarrowLeftIcon,
  ArrowNarrowRightIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckCircleIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CurrencyDollarIcon,
  LinkIcon,
  LocationMarkerIcon,
  MailIcon,
} from '@heroicons/react/solid'
import useApi from 'hooks/useApi'
import getServerSidePropsForUserDashboardPages from '@/server/getServerSidePropsForUserDashboardPages'
import useCurrentUser from 'hooks/useCurrentUser'
import classnames from '@/common/classnames'

const tabs = [
  { name: 'Applied', href: '#', count: '2', current: false },
  { name: 'Phone Screening', href: '#', count: '4', current: false },
  { name: 'Interview', href: '#', count: '6', current: true },
  { name: 'Offer', href: '#', current: false },
  { name: 'Disqualified', href: '#', current: false },
]

function OrdersList({ data }) {
  return (
    <main className="pt-8 pb-16">
      <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          <h2 className="text-lg font-medium text-gray-900">
            Candidates ({data.length} purchases)
          </h2>

          {/* Tabs */}
          <div className="sm:hidden">
            <label htmlFor="tabs" className="sr-only">
              Select a tab
            </label>
            <select
              id="tabs"
              name="tabs"
              className="mt-4 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
              defaultValue={tabs.find((tab) => tab.current).name}
            >
              {tabs.map((tab) => (
                <option key={tab.name}>{tab.name}</option>
              ))}
            </select>
          </div>
          <div className="hidden sm:block">
            <div className="border-b border-gray-200">
              <nav className="mt-2 -mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => (
                  <a
                    key={tab.name}
                    href={tab.href}
                    className={classnames(
                      tab.current
                        ? `border-purple-500 text-purple-600`
                        : `border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200`,
                      `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`,
                    )}
                  >
                    {tab.name}
                    {tab.count ? (
                      <span
                        className={classnames(
                          tab.current
                            ? `bg-purple-100 text-purple-600`
                            : `bg-gray-100 text-gray-900`,
                          `hidden ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block`,
                        )}
                      >
                        {tab.count}
                      </span>
                    ) : null}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Stacked list */}
        <ul
          className="mt-5 border-t border-gray-200 divide-y divide-gray-200 sm:mt-0 sm:border-t-0"
          role="list"
        >
          {data.map((order) => (
            <li key={order.id}>
              <a href="#" className="group block">
                <div className="flex items-center py-5 px-4 sm:py-6 sm:px-0">
                  <div className="min-w-0 flex-1 flex items-center">
                    <div className="flex-shrink-0">
                      <img
                        className="h-12 w-12 rounded-full group-hover:opacity-75"
                        src={order.imageUrl}
                        alt=""
                      />
                    </div>
                    <div className="min-w-0 flex-1 px-4 md:grid md:grid-cols-2 md:gap-4">
                      <div>
                        <p className="text-sm font-medium text-purple-600 truncate">
                          {order.name}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500">
                          <MailIcon
                            className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400"
                            aria-hidden="true"
                          />
                          <span className="truncate">{order.description}</span>
                        </p>
                      </div>
                      <div className="hidden md:block">
                        <div>
                          <p className="text-sm text-gray-900">
                            Applied on{' '}
                            <time dateTime={order.appliedDatetime}>
                              {order.applied}
                            </time>
                          </p>
                          <p className="mt-2 flex items-center text-sm text-gray-500">
                            <CheckCircleIcon
                              className="flex-shrink-0 mr-1.5 h-5 w-5 text-green-400"
                              aria-hidden="true"
                            />
                            {order.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <ChevronRightIcon
                      className="h-5 w-5 text-gray-400 group-hover:text-gray-700"
                      aria-hidden="true"
                    />
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>

        {/* Pagination */}
        <nav
          className="border-t border-gray-200 px-4 flex items-center justify-between sm:px-0"
          aria-label="Pagination"
        >
          <div className="-mt-px w-0 flex-1 flex">
            <a
              href="#"
              className="border-t-2 border-transparent pt-4 pr-1 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-200"
            >
              <ArrowNarrowLeftIcon
                className="mr-3 h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
              Previous
            </a>
          </div>
          <div className="hidden md:-mt-px md:flex">
            <a
              href="#"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200 border-t-2 pt-4 px-4 inline-flex items-center text-sm font-medium"
            >
              1
            </a>
            {/* Current: "border-purple-500 text-purple-600", Default: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200" */}
            <a
              href="#"
              className="border-purple-500 text-purple-600 border-t-2 pt-4 px-4 inline-flex items-center text-sm font-medium"
              aria-current="page"
            >
              2
            </a>
            <a
              href="#"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200 border-t-2 pt-4 px-4 inline-flex items-center text-sm font-medium"
            >
              3
            </a>
            <a
              href="#"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200 border-t-2 pt-4 px-4 inline-flex items-center text-sm font-medium"
            >
              4
            </a>
            <a
              href="#"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200 border-t-2 pt-4 px-4 inline-flex items-center text-sm font-medium"
            >
              5
            </a>
            <a
              href="#"
              className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200 border-t-2 pt-4 px-4 inline-flex items-center text-sm font-medium"
            >
              6
            </a>
          </div>
          <div className="-mt-px w-0 flex-1 flex justify-end">
            <a
              href="#"
              className="border-t-2 border-transparent pt-4 pl-1 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-200"
            >
              Next
              <ArrowNarrowRightIcon
                className="ml-3 h-5 w-5 text-gray-400"
                aria-hidden="true"
              />
            </a>
          </div>
        </nav>
      </div>
    </main>
  )
}

export default function MyPurchases() {
  const { user } = useCurrentUser()
  const ordersQuery = useApi(
    'orders',
    'list',
    {
      payerId: user.data.id,
      nbResultsPerPage: 100,
    },
    { initialData: [], enabled: user.isLoggedIn },
  )

  return (
    <DashboardShell>
      <NextSeo title="My Purchases" />
      <div className="relative min-h-screen bg-white">
        {ordersQuery.data.length === 0 ? (
          'Oh no! You have no orders yet...'
        ) : (
          <OrdersList {...ordersQuery} />
        )}
      </div>
    </DashboardShell>
  )
}

export const getServerSideProps = getServerSidePropsForUserDashboardPages()
