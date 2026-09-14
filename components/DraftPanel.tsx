'use client';

import styles from './map.module.css';
import Panel from './Panel';
import type { PinDraft } from './PinsLayer';

const FORM_ID = 'draft-pin-form';

type DraftPanelProps = {
    draft: PinDraft;
    onChange: (draft: PinDraft) => void;
    onAdd: () => void;
    onCancel: () => void;
};

export default function DraftPanel({ draft, onChange, onAdd, onCancel }: DraftPanelProps) {
    const canAdd = draft.name.trim().length > 0;

    return (
        <Panel
            title="New pin"
            label="Add a new pin"
            onClose={onCancel}
            subtitle={
                <span className={styles.panelCoords}>
                    {draft.lat.toFixed(5)}, {draft.lng.toFixed(5)}
                </span>
            }
            footer={
                <div className={styles.panelActions}>
                    <button type="submit" form={FORM_ID} className={styles.primaryButton} disabled={!canAdd}>
                        Add pin
                    </button>

                    <button type="button" className={styles.reviewCancelButton} onClick={onCancel}>
                        Cancel
                    </button>
                </div>
            }
        >
            <form
                id={FORM_ID}
                className={styles.field}
                onSubmit={(e) => {
                    e.preventDefault();
                    if (canAdd) onAdd();
                }}
            >
                <label className={styles.fieldLabel} htmlFor="draft-pin-name">
                    Name
                </label>

                <input
                    id="draft-pin-name"
                    autoFocus
                    className={styles.fieldInput}
                    value={draft.name}
                    onChange={(e) => onChange({ ...draft, name: e.target.value })}
                    placeholder="Name this pin…"
                />
            </form>
        </Panel>
    );
}
