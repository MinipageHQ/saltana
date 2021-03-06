import Link from 'next/link'

const navigationFooter = [
  { name: 'Product Updates', href: '/product-updates' },
  { name: 'Blog', href: '/blog' },
  { name: 'API', href: '/docs' },
  { name: 'Support', href: '/help' },
]

export default function Footer() {
  return (
    <footer className="bg-white text-black">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <nav
          className="-mx-5 -my-2 flex flex-wrap justify-center"
          aria-label="Footer"
        >
          {navigationFooter.map(({ name, href }) => (
            <div key={name} className="px-5 py-2">
              <Link href={href}>
                <a className="text-base text-black hover:text-gray-500">
                  {name}
                </a>
              </Link>
            </div>
          ))}
        </nav>
        <p className="mt-8 text-center text-base text-black">
          &copy; 2021 Saltana, Inc. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
