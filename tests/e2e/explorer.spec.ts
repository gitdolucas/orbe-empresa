import { test, expect } from '@playwright/test';

test('quiet home reveals company details only after an explicit consultation', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Conheça a empresa. Além do CNPJ.' }),
  ).toBeVisible();
  await expect(page.getByRole('region', { name: 'Perfil da empresa' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Open Knowledge Brasil' }).click();
  await expect(
    page.getByRole('heading', { name: 'Open Knowledge Brasil', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Conheça a empresa. Além do CNPJ.' })).toHaveCount(
    0,
  );
  await expect(page.getByText('CNPJ básico · pessoa jurídica')).not.toBeVisible();
  await page.getByText('Mais dados cadastrais', { exact: true }).click();
  await expect(page.getByText('CNPJ básico · pessoa jurídica')).toBeVisible();
  await page.getByText('Fonte e atualidade dos dados', { exact: true }).click();
  await expect(
    page.getByText(/Data de coleta não equivale à atualização do cadastro/),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'Histórico', exact: true }).click();
  await expect(page.getByText('A história começa com dados verificáveis.')).toBeVisible();
  await page.getByRole('tab', { name: 'Atividades observadas' }).click();
  await expect(page.getByRole('heading', { name: 'Capacitação em dados' })).toBeVisible();
  await page.getByText('1 evidência verificável').first().click();
  await expect(
    page.getByText('Automação de pipelines e processos de ETL', { exact: true }),
  ).toBeVisible();
  await page.getByRole('tab', { name: 'JSON', exact: true }).click();
  await expect(page.getByText('"datasetPeriod": null', { exact: false })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar JSON' }).click();
  expect((await download).suggestedFilename()).toBe('empresa-19131243000197.json');
  await page.getByRole('textbox', { name: 'CNPJ da empresa' }).fill('123');
  await page.getByRole('button', { name: 'Consultar empresa', exact: true }).click();
  await expect(page.locator('#search-error')).toContainText('CNPJ inválido');
  await page.getByRole('link', { name: 'Nova consulta', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Perfil da empresa' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Banco do Brasil' }).click();
  await expect(page.getByRole('heading', { name: 'Banco do Brasil', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/empresa\/00000000000191/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Banco do Brasil', exact: true })).toBeVisible();
  await page.goto('/documentacao');
  await expect(page.getByRole('heading', { name: 'Endpoints', exact: true })).toBeVisible();
});

test('mobile home and consulted profile fit viewport; menu remains keyboard accessible', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await expect(page.getByRole('navigation', { name: 'Menu móvel' })).not.toBeVisible();
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Menu móvel' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('navigation', { name: 'Menu móvel' })).not.toBeVisible();
  await page.getByRole('button', { name: 'Open Knowledge Brasil' }).click();
  await expect(
    page.getByRole('heading', { name: 'Open Knowledge Brasil', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Abrir menu' }).click();
  await page
    .getByRole('navigation', { name: 'Menu móvel' })
    .getByRole('link', { name: 'Fontes', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: 'Confiança começa pela origem.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
