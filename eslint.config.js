import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const styleUnitRegex = /(^-?\d+(\.\d+)?(px|rem|em|vh|vw|%)$)|(^calc\()/
const colorLiteralRegex = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})|rgba?\(|hsla?\(/

const designSystemPlugin = {
  rules: {
    'no-raw-style-literals': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow raw style literals in style/sx props.',
        },
        schema: [],
        messages: {
          rawLiteral:
            'Use design-system tokens instead of raw style literals.',
        },
      },
      create(context) {
        const checkNode = (node) => {
          if (!node) return
          if (
            node.type === 'Literal' &&
            (typeof node.value === 'number' ||
              (typeof node.value === 'string' && styleUnitRegex.test(node.value)))
          ) {
            context.report({ node, messageId: 'rawLiteral' })
          }
          if (node.type === 'ObjectExpression') {
            node.properties.forEach((prop) => {
              if (prop.type === 'Property') checkNode(prop.value)
            })
          }
          if (node.type === 'ArrayExpression') {
            node.elements.forEach((element) => checkNode(element))
          }
        }

        return {
          JSXAttribute(node) {
            if (
              node.name.type !== 'JSXIdentifier' ||
              (node.name.name !== 'style' && node.name.name !== 'sx')
            ) {
              return
            }
            if (
              node.value?.type === 'JSXExpressionContainer' &&
              node.value.expression.type === 'ObjectExpression'
            ) {
              checkNode(node.value.expression)
            }
          },
        }
      },
    },
    'no-color-literals': {
      meta: {
        type: 'problem',
        docs: {
          description: 'Disallow raw color literals in UI files.',
        },
        schema: [],
        messages: {
          colorLiteral:
            'Use theme color tokens instead of hardcoded color literals.',
        },
      },
      create(context) {
        return {
          Literal(node) {
            if (
              typeof node.value === 'string' &&
              colorLiteralRegex.test(node.value)
            ) {
              context.report({ node, messageId: 'colorLiteral' })
            }
          },
          TemplateElement(node) {
            if (colorLiteralRegex.test(node.value.raw)) {
              context.report({ node, messageId: 'colorLiteral' })
            }
          },
        }
      },
    },
  },
}

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/theme/**/*', 'src/types/**/*', 'src/services/**/*', 'src/hooks/**/*', 'src/utils/**/*'],
    plugins: {
      'design-system': designSystemPlugin,
    },
    rules: {
      'design-system/no-raw-style-literals': 'error',
      'design-system/no-color-literals': 'error',
      '@typescript-eslint/no-magic-numbers': [
        'error',
        {
          ignore: [
            -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
            18, 19, 20, 21, 22, 23, 24, 25, 28, 30, 31, 32, 39, 40, 48, 50,
            52, 60, 70, 80, 92, 100, 120, 136, 170, 280, 320, 400, 500, 2500,
            20000,
          ],
          ignoreArrayIndexes: true,
          ignoreEnums: true,
          ignoreNumericLiteralTypes: true,
          ignoreReadonlyClassProperties: true,
        },
      ],
    },
  },
])
