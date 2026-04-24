import { useState } from 'react'
import { Button } from '@renderer/components/ui-native/Button'
import { TextField } from '@renderer/components/ui-native/TextField'
import { TextArea } from '@renderer/components/ui-native/TextArea'
import { PasswordField } from '@renderer/components/ui-native/PasswordField'
import { NumberField } from '@renderer/components/ui-native/NumberField'
import { Stepper } from '@renderer/components/ui-native/Stepper'
import { Toggle } from '@renderer/components/ui-native/Toggle'
import { Checkbox } from '@renderer/components/ui-native/Checkbox'
import { RadioGroup, Radio } from '@renderer/components/ui-native/RadioGroup'
import { Slider } from '@renderer/components/ui-native/Slider'
import { Select } from '@renderer/components/ui-native/Select'
import { ComboBox } from '@renderer/components/ui-native/ComboBox'
import { DatePicker } from '@renderer/components/ui-native/DatePicker'
import { TimePicker } from '@renderer/components/ui-native/TimePicker'
import { FormRow } from '@renderer/components/ui-native/FormRow'
import { SegmentedControl } from '@renderer/components/ui-native/SegmentedControl'
import { GallerySection, GalleryRow } from './GallerySection'

const OPTIONS = [
  { value: 'apple', label: 'Apple' },
  { value: 'pear', label: 'Pear' },
  { value: 'grape', label: 'Grape' },
  { value: 'lychee', label: 'Lychee' }
] as const

export function FormGallery(): React.ReactElement {
  const [text, setText] = useState<string>('')
  const [area, setArea] = useState<string>('')
  const [pw, setPw] = useState<string>('')
  const [num, setNum] = useState<number | null>(3)
  const [step, setStep] = useState<number>(2)
  const [on, setOn] = useState<boolean>(true)
  const [check, setCheck] = useState<boolean | 'indeterminate'>(false)
  const [radio, setRadio] = useState<string>('apple')
  const [slide, setSlide] = useState<number>(40)
  const [sel, setSel] = useState<string>('apple')
  const [combo, setCombo] = useState<string | null>(null)
  const [date, setDate] = useState<Date | null>(null)
  const [time, setTime] = useState<{ hours: number; minutes: number } | null>({ hours: 9, minutes: 30 })
  const [seg, setSeg] = useState<string>('day')

  return (
    <>
      <GallerySection id="button" title="Button" subtitle="Variants × sizes × states">
        <GalleryRow label="Primary">
          <Button variant="primary" size="sm">
            Small
          </Button>
          <Button variant="primary" size="md">
            Medium
          </Button>
          <Button variant="primary" size="lg">
            Large
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
          <Button variant="primary" isLoading>
            Loading
          </Button>
        </GalleryRow>
        <GalleryRow label="Secondary">
          <Button variant="secondary">Default</Button>
          <Button variant="secondary" disabled>
            Disabled
          </Button>
          <Button variant="secondary" isLoading>
            Loading
          </Button>
        </GalleryRow>
        <GalleryRow label="Plain">
          <Button variant="plain">Plain</Button>
          <Button variant="plain" disabled>
            Disabled
          </Button>
        </GalleryRow>
        <GalleryRow label="Destructive">
          <Button variant="destructive">Delete</Button>
          <Button variant="destructive" isLoading>
            Deleting
          </Button>
        </GalleryRow>
        <GalleryRow label="Icon">
          <Button variant="icon" aria-label="Add">
            +
          </Button>
        </GalleryRow>
      </GallerySection>

      <GallerySection id="textfield" title="TextField">
        <GalleryRow label="Default">
          <TextField value={text} onChange={(e) => setText(e.target.value)} placeholder="Type here" />
        </GalleryRow>
        <GalleryRow label="With hint">
          <TextField value={text} onChange={(e) => setText(e.target.value)} hint="Helper text" />
        </GalleryRow>
        <GalleryRow label="With error">
          <TextField value={text} onChange={(e) => setText(e.target.value)} error="This field is required" />
        </GalleryRow>
        <GalleryRow label="Disabled / Readonly">
          <TextField value="Disabled" onChange={() => undefined} disabled />
          <TextField value="Readonly" onChange={() => undefined} readOnly />
        </GalleryRow>
        <GalleryRow label="Sizes">
          <TextField size="sm" value={text} onChange={(e) => setText(e.target.value)} />
          <TextField size="md" value={text} onChange={(e) => setText(e.target.value)} />
          <TextField size="lg" value={text} onChange={(e) => setText(e.target.value)} />
        </GalleryRow>
      </GallerySection>

      <GallerySection id="textarea" title="TextArea">
        <GalleryRow label="Auto-grow">
          <TextArea
            value={area}
            onChange={(e) => setArea(e.target.value)}
            placeholder="Multi-line…"
            style={{ width: 320 }}
          />
        </GalleryRow>
      </GallerySection>

      <GallerySection id="passwordfield" title="PasswordField">
        <GalleryRow label="Show/hide">
          <PasswordField value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" />
        </GalleryRow>
      </GallerySection>

      <GallerySection id="numberfield" title="NumberField">
        <GalleryRow label="With stepper">
          <NumberField value={num} onChange={setNum} min={0} max={10} step={1} />
        </GalleryRow>
      </GallerySection>

      <GallerySection id="stepper" title="Stepper">
        <GalleryRow label="Numeric">
          <Stepper
            onIncrement={() => setStep((v) => Math.min(10, v + 1))}
            onDecrement={() => setStep((v) => Math.max(0, v - 1))}
            canIncrement={step < 10}
            canDecrement={step > 0}
          />
          <span style={{ fontSize: 13, color: 'var(--color-fg-tertiary)' }}>
            Current: {step}
          </span>
        </GalleryRow>
      </GallerySection>

      <GallerySection id="toggle" title="Toggle">
        <GalleryRow label="Switch">
          <Toggle checked={on} onChange={setOn} />
          <Toggle checked={!on} onChange={(v) => setOn(!v)} />
          <Toggle checked={false} onChange={() => undefined} disabled />
        </GalleryRow>
      </GallerySection>

      <GallerySection id="checkbox" title="Checkbox">
        <GalleryRow label="States">
          <Checkbox checked={check === true} onChange={setCheck} />
          <Checkbox
            checked={check === 'indeterminate' ? 'indeterminate' : false}
            onChange={setCheck}
          />
          <Checkbox checked={false} onChange={() => undefined} disabled />
        </GalleryRow>
      </GallerySection>

      <GallerySection id="radio" title="RadioGroup">
        <GalleryRow label="Fruit">
          <RadioGroup value={radio} onChange={setRadio}>
            <Radio value="apple" label="Apple" />
            <Radio value="pear" label="Pear" />
            <Radio value="grape" label="Grape" />
          </RadioGroup>
        </GalleryRow>
      </GallerySection>

      <GallerySection id="slider" title="Slider">
        <GalleryRow label="0-100">
          <div style={{ width: 260 }}>
            <Slider value={slide} onChange={setSlide} min={0} max={100} />
          </div>
        </GalleryRow>
      </GallerySection>

      <GallerySection id="select" title="Select">
        <GalleryRow label="Pop-up">
          <Select value={sel} onChange={setSel} options={OPTIONS} />
        </GalleryRow>
      </GallerySection>

      <GallerySection id="combobox" title="ComboBox">
        <GalleryRow label="Typeahead">
          <ComboBox value={combo} onChange={setCombo} options={OPTIONS} placeholder="Pick fruit…" />
        </GalleryRow>
      </GallerySection>

      <GallerySection id="datepicker" title="DatePicker">
        <GalleryRow label="Single date">
          <DatePicker value={date} onChange={setDate} />
        </GalleryRow>
      </GallerySection>

      <GallerySection id="timepicker" title="TimePicker">
        <GalleryRow label="24h">
          <TimePicker value={time} onChange={setTime} mode="24h" />
        </GalleryRow>
        <GalleryRow label="12h">
          <TimePicker value={time} onChange={setTime} mode="12h" />
        </GalleryRow>
      </GallerySection>

      <GallerySection id="formrow" title="FormRow">
        <FormRow label="Name" hint="Shown on your profile">
          <TextField value={text} onChange={(e) => setText(e.target.value)} />
        </FormRow>
        <FormRow label="Required" error="Please enter a value">
          <TextField value="" onChange={() => undefined} />
        </FormRow>
      </GallerySection>

      <GallerySection id="segmentedcontrol" title="SegmentedControl">
        <GalleryRow label="Timescale">
          <SegmentedControl
            value={seg}
            onChange={setSeg}
            options={[
              { value: 'day', label: 'Day' },
              { value: 'week', label: 'Week' },
              { value: 'month', label: 'Month' }
            ]}
          />
        </GalleryRow>
      </GallerySection>
    </>
  )
}
