/**
 * @file CanvasMapV2Spec.stories.jsx
 * @description Storybook stories for the spec-driven Canvas Map V2.
 */

import React from 'react';
import { CanvasMapV2Spec } from './CanvasMapV2Spec';

export default {
  title: 'Panels/CanvasMap/V2 Spec',
  component: CanvasMapV2Spec,
  decorators: [
    (Story) => (
      <div style={{ width: '100vw', height: '100vh', background: '#020406', padding: 24, boxSizing: 'border-box' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    width: 480,
    height: 650,
    showDebugControls: false,
  },
  argTypes: {
    width: { control: { type: 'number', min: 320, max: 720, step: 10 } },
    height: { control: { type: 'number', min: 520, max: 920, step: 10 } },
    showDebugControls: { control: 'boolean' },
  },
};

export const Default = {
  render: (args) => {
    const [isOpen, setIsOpen] = React.useState(true);

    return (
      <div>
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            style={{
              marginBottom: 12,
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid rgba(255, 255, 255, 0.12)',
              background: 'rgba(96, 165, 250, 0.08)',
              color: '#e2e8f0',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            Reopen Canvas Map
          </button>
        )}

        {isOpen && (
          <CanvasMapV2Spec
            width={args.width}
            height={args.height}
            showDebugControls={args.showDebugControls}
            onClose={() => setIsOpen(false)}
          />
        )}
      </div>
    );
  },
};
