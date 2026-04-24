import { describe, it } from 'vitest'
import { render } from '@testing-library/react'
import { expectNoAxeViolations } from '../../../test/axe'

import { Alert } from './Alert'
import { Avatar } from './Avatar'
import { Badge } from './Badge'
import { Button } from './Button'
import { Checkbox } from './Checkbox'
import { CircularProgress } from './CircularProgress'
import { ComboBox } from './ComboBox'
import { ContextMenu } from './ContextMenu'
import { DatePicker } from './DatePicker'
import { Disclosure } from './Disclosure'
import { Divider } from './Divider'
import { DropdownMenu } from './DropdownMenu'
import { EmptyState } from './EmptyState'
import { FormRow } from './FormRow'
import { KeyCap } from './KeyCap'
import { ListRow } from './ListRow'
import { NumberField } from './NumberField'
import { PasswordField } from './PasswordField'
import { Pill } from './Pill'
import { Popover } from './Popover'
import { ProgressBar } from './ProgressBar'
import { Radio, RadioGroup } from './RadioGroup'
import { Section } from './Section'
import { SegmentedControl } from './SegmentedControl'
import { Select } from './Select'
import { Sheet } from './Sheet'
import { Skeleton } from './Skeleton'
import { Slider } from './Slider'
import { StatusDot } from './StatusDot'
import { Stepper } from './Stepper'
import { Surface } from './Surface'
import { TextArea } from './TextArea'
import { TextField } from './TextField'
import { TimePicker } from './TimePicker'
import { Toast, ToastProvider, ToastViewport } from './Toast'
import { Toggle } from './Toggle'
import { Tooltip, TooltipProvider } from './Tooltip'
import { DiscordIcon } from './icons/DiscordIcon'
import { TelegramIcon } from './icons/TelegramIcon'

const OPTIONS = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' }
] as const

const noop = (): void => undefined

describe('ui-native accessibility (axe-core)', () => {
  it('Button primary is axe-clean', async () => {
    const { container } = render(<Button>Save</Button>)
    await expectNoAxeViolations(container)
  })

  it('Button icon requires aria-label', async () => {
    const { container } = render(
      <Button variant="icon" aria-label="Add">
        +
      </Button>
    )
    await expectNoAxeViolations(container)
  })

  it('TextField with label via FormRow is axe-clean', async () => {
    const { container } = render(
      <FormRow label="Email" hint="We won't share it">
        <TextField value="" onChange={noop} />
      </FormRow>
    )
    await expectNoAxeViolations(container)
  })

  it('TextArea via FormRow is axe-clean', async () => {
    const { container } = render(
      <FormRow label="Bio">
        <TextArea value="" onChange={noop} />
      </FormRow>
    )
    await expectNoAxeViolations(container)
  })

  it('PasswordField via FormRow is axe-clean', async () => {
    const { container } = render(
      <FormRow label="Password">
        <PasswordField value="" onChange={noop} />
      </FormRow>
    )
    await expectNoAxeViolations(container)
  })

  it('NumberField via FormRow is axe-clean', async () => {
    const { container } = render(
      <FormRow label="Count">
        <NumberField value={3} onChange={noop} />
      </FormRow>
    )
    await expectNoAxeViolations(container)
  })

  it('Stepper has accessible button labels', async () => {
    const { container } = render(<Stepper onIncrement={noop} onDecrement={noop} />)
    await expectNoAxeViolations(container)
  })

  it('Toggle has switch role with accessible label', async () => {
    const { container } = render(
      <Toggle checked={false} onChange={noop} label="Notifications" />
    )
    await expectNoAxeViolations(container)
  })

  it('Checkbox via FormRow is axe-clean', async () => {
    const { container } = render(
      <FormRow label="Remember me">
        <Checkbox checked={false} onChange={noop} />
      </FormRow>
    )
    await expectNoAxeViolations(container)
  })

  it('RadioGroup with labeled radios is axe-clean', async () => {
    const { container } = render(
      <RadioGroup value="a" onChange={noop}>
        <Radio value="a" label="A" />
        <Radio value="b" label="B" />
      </RadioGroup>
    )
    await expectNoAxeViolations(container)
  })

  it('Slider has aria value attributes', async () => {
    const { container } = render(
      <Slider value={30} onChange={noop} min={0} max={100} ariaLabel="Volume" />
    )
    await expectNoAxeViolations(container)
  })

  it('Select with aria-label is axe-clean', async () => {
    const { container } = render(
      <Select
        value={null}
        onChange={noop}
        options={OPTIONS}
        ariaLabel="Fruit"
        placeholder="Pick…"
      />
    )
    await expectNoAxeViolations(container)
  })

  it('ComboBox with aria-label is axe-clean', async () => {
    const { container } = render(
      <ComboBox
        value={null}
        onChange={noop}
        options={OPTIONS}
        ariaLabel="Fruit"
        placeholder="Pick…"
      />
    )
    await expectNoAxeViolations(container)
  })

  it('DatePicker with aria-label is axe-clean', async () => {
    const { container } = render(
      <DatePicker value={null} onChange={noop} ariaLabel="Date" />
    )
    await expectNoAxeViolations(container)
  })

  it('TimePicker with aria-label is axe-clean', async () => {
    const { container } = render(
      <TimePicker
        value={{ hours: 9, minutes: 30 }}
        onChange={noop}
        mode="24h"
        ariaLabel="Time"
      />
    )
    await expectNoAxeViolations(container)
  })

  it('SegmentedControl has tablist role', async () => {
    const { container } = render(
      <SegmentedControl
        value="a"
        onChange={noop}
        options={OPTIONS}
        ariaLabel="Fruit filter"
      />
    )
    await expectNoAxeViolations(container)
  })

  it('Sheet content is axe-clean', async () => {
    const { baseElement } = render(
      <Sheet open onOpenChange={noop} title="Example" description="desc">
        <p>Body</p>
      </Sheet>
    )
    // aria-hidden-focus: known Radix focus-trap sentinel false positive in happy-dom
    await expectNoAxeViolations(baseElement, { disabledRules: ['aria-hidden-focus'] })
  })

  it('Alert is axe-clean', async () => {
    const { baseElement } = render(
      <Alert
        open
        onOpenChange={noop}
        tone="destructive"
        title="Delete?"
        description="Permanent."
      />
    )
    await expectNoAxeViolations(baseElement, { disabledRules: ['aria-hidden-focus'] })
  })

  it('Popover trigger is axe-clean', async () => {
    const { container } = render(
      <Popover trigger={<button>Open</button>}>
        <div>body</div>
      </Popover>
    )
    await expectNoAxeViolations(container)
  })

  it('Tooltip trigger is axe-clean', async () => {
    const { container } = render(
      <TooltipProvider>
        <Tooltip label="More info">
          <button aria-label="Help">?</button>
        </Tooltip>
      </TooltipProvider>
    )
    await expectNoAxeViolations(container)
  })

  it('ContextMenu trigger is axe-clean', async () => {
    const { container } = render(
      <ContextMenu
        trigger={<div role="button" tabIndex={0}>Target</div>}
        items={[{ id: 'a', label: 'A', onSelect: noop }]}
      />
    )
    await expectNoAxeViolations(container)
  })

  it('DropdownMenu trigger is axe-clean', async () => {
    const { container } = render(
      <DropdownMenu
        trigger={<button>Open</button>}
        items={[{ id: 'a', label: 'A', onSelect: noop }]}
      />
    )
    await expectNoAxeViolations(container)
  })

  it('ListRow is axe-clean', async () => {
    const { container } = render(
      <div>
        <ListRow title="Alice" subtitle="alice@example.com" selected onSelect={noop} />
      </div>
    )
    await expectNoAxeViolations(container)
  })

  it('Disclosure is axe-clean', async () => {
    const { container } = render(
      <Disclosure title="Advanced">
        <p>body</p>
      </Disclosure>
    )
    await expectNoAxeViolations(container)
  })

  it('EmptyState is axe-clean', async () => {
    const { container } = render(
      <EmptyState title="Empty" subtitle="Try again" />
    )
    await expectNoAxeViolations(container)
  })

  it('EmptyState error variant is axe-clean', async () => {
    const { container } = render(
      <EmptyState variant="error" title="Failed" subtitle="Retry" />
    )
    await expectNoAxeViolations(container)
  })

  it('Toast is axe-clean', async () => {
    const { baseElement } = render(
      <ToastProvider>
        <Toast open onOpenChange={noop} title="Saved" description="OK" variant="success" />
        <ToastViewport />
      </ToastProvider>
    )
    await expectNoAxeViolations(baseElement, { disabledRules: ['aria-hidden-focus'] })
  })

  it('ProgressBar with aria-label is axe-clean', async () => {
    const { container } = render(<ProgressBar value={42} ariaLabel="Upload" />)
    await expectNoAxeViolations(container)
  })

  it('CircularProgress with aria-label is axe-clean', async () => {
    const { container } = render(<CircularProgress value={42} ariaLabel="Loading" />)
    await expectNoAxeViolations(container)
  })

  it('Avatar is axe-clean', async () => {
    const { container } = render(<Avatar name="Alice Liddell" />)
    await expectNoAxeViolations(container)
  })

  it('Pill is axe-clean', async () => {
    const { container } = render(<Pill variant="discord">Discord</Pill>)
    await expectNoAxeViolations(container)
  })

  it('Badge is axe-clean', async () => {
    const { container } = render(<Badge count={3} />)
    await expectNoAxeViolations(container)
  })

  it('KeyCap is axe-clean', async () => {
    const { container } = render(<KeyCap keys={['cmd', 'K']} />)
    await expectNoAxeViolations(container)
  })

  it('StatusDot is axe-clean', async () => {
    const { container } = render(<StatusDot tone="success" />)
    await expectNoAxeViolations(container)
  })

  it('Divider is axe-clean', async () => {
    const { container } = render(<Divider />)
    await expectNoAxeViolations(container)
  })

  it('Skeleton is axe-clean', async () => {
    const { container } = render(<Skeleton variant="line" />)
    await expectNoAxeViolations(container)
  })

  it('Surface is axe-clean', async () => {
    const { container } = render(<Surface>card</Surface>)
    await expectNoAxeViolations(container)
  })

  it('Section is axe-clean', async () => {
    const { container } = render(
      <Section title="Title" subtitle="Sub">
        body
      </Section>
    )
    await expectNoAxeViolations(container)
  })

  it('Brand icons are axe-clean', async () => {
    const { container } = render(
      <>
        <DiscordIcon />
        <TelegramIcon />
      </>
    )
    await expectNoAxeViolations(container)
  })
})
