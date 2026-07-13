import { getSettings, setSettings } from '@/lib/storage';

const baseThresholdInput = document.querySelector<HTMLInputElement>('#baseThreshold')!;
const incrementRateInput = document.querySelector<HTMLInputElement>('#incrementRate')!;
const blurOnStopInput = document.querySelector<HTMLInputElement>('#blurOnStop')!;
const saveButton = document.querySelector<HTMLButtonElement>('#save')!;
const statusEl = document.querySelector<HTMLElement>('#status')!;

async function loadForm(): Promise<void> {
  const settings = await getSettings();
  baseThresholdInput.value = String(settings.baseThreshold);
  incrementRateInput.value = String(Math.round(settings.incrementRate * 100));
  blurOnStopInput.checked = settings.blurOnStop;
}

async function saveForm(): Promise<void> {
  const baseThreshold = Math.max(100, Number(baseThresholdInput.value) || 0);
  const incrementRate = Math.min(90, Math.max(0, Number(incrementRateInput.value) || 0)) / 100;
  const blurOnStop = blurOnStopInput.checked;

  await setSettings({ baseThreshold, incrementRate, blurOnStop });

  statusEl.textContent = '保存しました';
  window.setTimeout(() => {
    statusEl.textContent = '';
  }, 2000);
}

saveButton.addEventListener('click', () => void saveForm());
void loadForm();
