import {
  WEAPON_CONFIGS,
  WEAPON_INVENTORY_SIZE,
} from '@/game/config/weaponConfig';

type WeaponInventoryProps = {
  slots: readonly (string | null)[];
  activeSlotIndex: number;
};

export function WeaponInventory({
  slots,
  activeSlotIndex,
}: WeaponInventoryProps) {
  return (
    <ol
      className='weapon-inventory'
      role='list'
      aria-label='Weapon inventory'
    >
      {Array.from({ length: WEAPON_INVENTORY_SIZE }, (_, index) => {
        const weaponId = slots[index] ?? null;
        const weapon = WEAPON_CONFIGS.find(({ id }) => id === weaponId);
        const selected = index === activeSlotIndex && Boolean(weapon);

        return (
          <li
            key={index}
            className={`weapon-inventory__slot${
              selected ? ' weapon-inventory__slot--selected' : ''
            }${weapon ? '' : ' weapon-inventory__slot--empty'}`}
            aria-current={selected ? 'true' : undefined}
            aria-label={
              weapon ? `${index + 1}: ${weapon.label}` : `${index + 1}: Empty`
            }
          >
            <span className='weapon-inventory__key'>{index + 1}</span>
            {weapon ? (
              <>
                <img
                  className='weapon-inventory__icon'
                  src={`/assets/weapons/${weapon.id}.png`}
                  alt=''
                  aria-hidden='true'
                />
                <span className='weapon-inventory__label'>{weapon.label}</span>
              </>
            ) : (
              <span className='weapon-inventory__empty-mark' aria-hidden='true'>
                +
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
