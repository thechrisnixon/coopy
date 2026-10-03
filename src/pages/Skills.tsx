import { VStack } from '@astryxdesign/core/VStack'
import { Heading } from '@astryxdesign/core/Heading'
import { Text } from '@astryxdesign/core/Text'
import { Code } from '@astryxdesign/core/Code'
import { CodeBlock } from '@astryxdesign/core/CodeBlock'
import { Link } from '@astryxdesign/core/Link'

/**
 * Install instructions for the /weekly-shop Claude Code skill. The skill file
 * is published verbatim at build time by vite/data-plugin.ts; the household
 * profile it reads is private and never on this site.
 */

const SKILL_PATH = '/skills/weekly-shop/SKILL.md'
const INSTALL =
  'mkdir -p ~/.claude/skills/weekly-shop && curl -fsSL https://coopy-nu.vercel.app/skills/weekly-shop/SKILL.md -o ~/.claude/skills/weekly-shop/SKILL.md'

export default function Skills() {
  return (
    <VStack gap={8} maxWidth="44rem">
      <VStack gap={3}>
        <Heading level={1} className="display" style={{ fontSize: 'var(--display-lg)' }}>
          The weekly shop
        </Heading>
        <Text as="p" color="secondary">
          A Claude Code skill that plans the week's meals with you — coopy recipes,
          links, or one-offs — and builds the Whole Foods order on Amazon in Chrome.
          You adjust it together in conversation, and it only places the order when
          you explicitly say so.
        </Text>
      </VStack>

      <VStack gap={3}>
        <Heading level={2}>1. Install it</Heading>
        <Text as="p">Paste this into a terminal:</Text>
        <CodeBlock code={INSTALL} language="bash" isWrapped width="100%" />
        <Text as="p" color="secondary">
          Or{' '}
          <Link href={SKILL_PATH} download="SKILL.md">
            download SKILL.md
          </Link>{' '}
          and save it as <Code>~/.claude/skills/weekly-shop/SKILL.md</Code>. Run
          the same command again any time to update it.
        </Text>
      </VStack>

      <VStack gap={3}>
        <Heading level={2}>2. Add your household profile</Heading>
        <Text as="p">
          The skill reads who's eating, dietary needs, staples, and brand rules from
          a profile that is private and never on this website. Get the file from
          the person who set coopy up for you and save it as:
        </Text>
        <CodeBlock code="~/.coopy/household.yaml" width="100%" />
        <Text as="p" color="secondary">
          No profile yet? The skill will offer to walk you through making one.
          Weekly plans are saved next to it, in <Code>~/.coopy/plans/</Code>.
        </Text>
      </VStack>

      <VStack gap={3}>
        <Heading level={2}>3. Connect Chrome</Heading>
        <Text as="p">
          The skill shops through the{' '}
          <Link href="https://claude.ai/chrome" isExternalLink>
            Claude in Chrome
          </Link>{' '}
          extension. Install it in the Chrome profile that's signed in to the
          Amazon account you order Whole Foods from. The skill never enters
          passwords — if Amazon asks you to sign in, it stops and asks you.
        </Text>
      </VStack>

      <VStack gap={3}>
        <Heading level={2}>4. Run it</Heading>
        <Text as="p">In Claude Code, type:</Text>
        <CodeBlock code="/weekly-shop" width="100%" />
        <Text as="p" color="secondary">
          Then tell it what you want to eat this week.
        </Text>
      </VStack>
    </VStack>
  )
}
