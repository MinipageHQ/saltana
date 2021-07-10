import { PlusIcon } from '@heroicons/react/outline'
import CreatorSlugField from 'components/Dashboard/Common/Fields/CreatorSlugField'
import useCreatorSpace from 'hooks/useCreatorSpace'
import React from 'react'
import 'twin.macro'

import { useFormContext } from 'react-hook-form'
import { NextSeo } from 'next-seo'

export default function CreatorDashboardLinkWorkflowsScreen() {
  return (
    <main>
      <NextSeo title="Workflows" />
      n8n integration with a simple interface but we need to define some
      "templates" for each link type
    </main>
  )
}
