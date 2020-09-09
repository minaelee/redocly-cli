import outdent from 'outdent';

import { parseYamlToDocument } from './utils';
import { parseRef } from '../ref-utils';
import { validateDocument } from '../validate';
import { LintConfig } from '../config/config';
import { BaseResolver } from '../resolve';

describe('ref-utils', () => {
  it(`should unescape refs with '/'`, () => {
    const reference = 'somefile.yaml#/components/schemas/scope~1domain-schema';
    expect(parseRef(reference)).toMatchInlineSnapshot(`
      Object {
        "pointer": Array [
          "components",
          "schemas",
          "scope/domain-schema",
        ],
        "uri": "somefile.yaml",
      }
    `);
  });

  it(`should unescape refs with '~'`, () => {
    const reference = 'somefile.yaml#/components/schemas/complex~0name';
    expect(parseRef(reference)).toMatchInlineSnapshot(`
      Object {
        "pointer": Array [
          "components",
          "schemas",
          "complex~name",
        ],
        "uri": "somefile.yaml",
      }
    `);
  });

  it(`should unescape complex urlencoded paths`, () => {
    const referene = 'somefile.yaml#/components/schemas/scope%2Fcomplex~name';
    expect(parseRef(referene)).toMatchInlineSnapshot(`
      Object {
        "pointer": Array [
          "components",
          "schemas",
          "scope/complex~name",
        ],
        "uri": "somefile.yaml",
      }
    `);
  });

  it(`should validate definition with urlencoded paths`, async () => {
    const document = parseYamlToDocument(
      outdent` 
        openapi: "3.0.0"
        info:
          version: 1.0.0
          title: Swagger Petstore
          description: Test definition
          license:
            name: MIT
            url: https://opensource.org/licenses/MIT
        servers:
          - url: http://petstore.swagger.io/v1
        paths:
          /pet:
            get:
              summary: List all pets
              operationId: listPets
              responses:
                '200':
                  description: A paged array of pets
                  content:
                    application/json:
                      schema:
                        $ref: "#/components/schemas/scope%3A%7Banimals~1Pet%7D"
        components:
          schemas:
            scope:{animals/Pet}:
              type: object
              properties:
                id:
                  type: integer
                  format: int64
                name:
                  type: string
      `,
      '',
    );

    const result = await validateDocument({
      document,
      externalRefResolver: new BaseResolver(),
      config: new LintConfig({}),
    });

    expect(result).toMatchInlineSnapshot(`
      Object {
        "oasVersion": "3.0.0",
        "results": Array [],
      }
    `);
  });
});
