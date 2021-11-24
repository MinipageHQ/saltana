const Link = ({ to, children, ...props }) => (
  <a href={`${to}`} {...props}>
    {children}
  </a>
)
import Image from 'next/image'
import OnboardingImage from '../../../../images/onboarding-image.jpg'
import OnboardingDecoration from '../../../../images/auth-decoration.png'
import useCurrentUser from '@/hooks/useCurrentUser'
import { isUsernameUnique } from '@/client/field-validators'
import useUpdateCurrentUser from '@/hooks/useUpdateCurrentUser'
import _ from 'lodash'
import { useRouter } from 'next/router'
import { useForm } from 'react-hook-form'
import { Fragment, useEffect, useRef, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'

import { NextSeo } from 'next-seo'


import { GetServerSideProps } from 'next'

import { dehydrate } from 'react-query/hydration'
import { requireSession } from "@clerk/nextjs/api";

import DashboardShell from 'components/Dashboard/Common/Shell'
import FormSubmitButton from 'components/FormSubmitButton'
import GenericFormFieldError from 'components/GenericFormFieldError'
import {
  createQueryClient,
  getSaltanaInstance,
  setUserData,
} from '@/client/api'
import { yupResolver } from '@hookform/resolvers/yup/dist/yup.umd'
import * as Yup from 'yup'

function CreatorOnboardingShell({ children, userData = {} }) {

  const { user } = useCurrentUser()
  console.log({ user })
  const router = useRouter()
  // form validation rules
  const validationSchema = Yup.object().shape({
    username: Yup.string().required('Username is required').min(3),
    firstname: Yup.string().required('First name is required'),
    lastname: Yup.string().required('Last name is required'),
    description: Yup.string().required('Description is required'),
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: yupResolver(validationSchema),
    criteriaMode: 'all',
    defaultValues: _.pick(userData, [
      'firstname',
      'lastname',
      'description',
      'username',
    ]),
  })

  async function onSuccess() {
    router.push(`/dashboard`)
  }

  const updateUserSettings = useUpdateCurrentUser({ onSuccess })

  async function onSubmit(data) {

    try {
      await isUsernameUnique(data.username)
    } catch (error) {
      setError('username', {
        type: 'unique',
        message: 'This username is unavailable. If you are known with this username across the web, contact us, we might be able to help.',
      }, { shouldFocus: true })

      return
    }

    try {
      const result = await updateUserSettings.mutateAsync(data)
      console.log("we have a result I guess", result)
    } catch (error) {
      //@TODO: what errors?
      console.log("got some errors from the api", error)
    }
  }
  const currentUser = useCurrentUser()
  return (
    <main className="bg-white">
      <div className="relative flex">
        {/* Content */}
        <div className="w-full md:w-1/2">
          <div className="min-h-screen h-full flex flex-col after:flex-1">
            <div className="flex-1">
              {/* Header */}
              <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                {/* Logo */}
                <Link className="block" to="/">
                  <svg width="32" height="32" viewBox="0 0 32 32">
                    <defs>
                      <linearGradient
                        x1="28.538%"
                        y1="20.229%"
                        x2="100%"
                        y2="108.156%"
                        id="logo-a"
                      >
                        <stop stopColor="#A5B4FC" stopOpacity="0" offset="0%" />
                        <stop stopColor="#A5B4FC" offset="100%" />
                      </linearGradient>
                      <linearGradient
                        x1="88.638%"
                        y1="29.267%"
                        x2="22.42%"
                        y2="100%"
                        id="logo-b"
                      >
                        <stop stopColor="#38BDF8" stopOpacity="0" offset="0%" />
                        <stop stopColor="#38BDF8" offset="100%" />
                      </linearGradient>
                    </defs>
                    <rect fill="#6366F1" width="32" height="32" rx="16" />
                    <path
                      d="M18.277.16C26.035 1.267 32 7.938 32 16c0 8.837-7.163 16-16 16a15.937 15.937 0 01-10.426-3.863L18.277.161z"
                      fill="#4F46E5"
                    />
                    <path
                      d="M7.404 2.503l18.339 26.19A15.93 15.93 0 0116 32C7.163 32 0 24.837 0 16 0 10.327 2.952 5.344 7.404 2.503z"
                      fill="url(#logo-a)"
                    />
                    <path
                      d="M2.223 24.14L29.777 7.86A15.926 15.926 0 0132 16c0 8.837-7.163 16-16 16-5.864 0-10.991-3.154-13.777-7.86z"
                      fill="url(#logo-b)"
                    />
                  </svg>
                </Link>
                <div className="text-sm">
                  Have an account?{' '}
                  <Link
                    className="font-medium text-indigo-500 hover:text-indigo-600"
                    to="/signin"
                  >
                    Sign In
                  </Link>
                </div>
              </div>

              {/* Progress bar */}
              <div className="px-4 pt-12 pb-8">
                <div className="max-w-md mx-auto w-full">
                  <div className="relative">
                    <div
                      className="absolute left-0 top-1/2 -mt-px w-full h-0.5 bg-gray-200"
                      aria-hidden="true"
                    ></div>
                    <ul className="relative flex justify-between w-full">
                      <li>
                        <Link
                          className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold bg-indigo-500 text-white"
                          to="/onboarding-01"
                        >
                          1
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold bg-gray-100 text-gray-500"
                          to="/onboarding-02"
                        >
                          2
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold bg-gray-100 text-gray-500"
                          to="/onboarding-03"
                        >
                          3
                        </Link>
                      </li>
                      <li>
                        <Link
                          className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold bg-gray-100 text-gray-500"
                          to="/onboarding-04"
                        >
                          4
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-8">
              {children}
            </div>
          </div>
        </div>

        {/* Image */}
        <div
          className="hidden md:block absolute top-0 bottom-0 right-0 md:w-1/2"
          aria-hidden="true"
        >
          <Image
            className="object-cover object-center w-full h-full"
            src={OnboardingImage}
            width="760"
            height="1024"
            alt="Onboarding"
          />
          <Image
            className="absolute top-1/4 left-0 transform -translate-x-1/2 ml-8 hidden lg:block"
            src={OnboardingDecoration}
            width="218"
            height="224"
            alt="Authentication decoration"
          />
        </div>
      </div>
    </main>
  )
}

export default CreatorOnboardingShell
