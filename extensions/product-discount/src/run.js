// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 * @typedef {import("../generated/api").Target} Target
 * @typedef {import("../generated/api").ProductVariant} ProductVariant
 * @typedef {import("../generated/api").BuyerIdentity} BuyerIdentity
 */

/**
 * @type {FunctionRunResult}
 */
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.First,
  discounts: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  // Define a type for your configuration, and parse it from the metafield
  /**
   * @type {{
   *   percentage: number,
   *   fixedAmount: number,
   *   conditional: string,
   *   productTags: object,
   * }}
   */
  const configuration = JSON.parse(
    input?.discountNode?.metafield?.value ?? "{}"
  );
  if (!configuration.percentage && !configuration.fixedAmount) {
    return EMPTY_DISCOUNT;
  }

  let targets;

  if (configuration.conditional === "OR") {
    if (input.cart.buyerIdentity?.customer?.hasAnyTag) {
      targets = input.cart.lines.map((line) => {
        const variant = /** @type {ProductVariant} */ (line.merchandise);
        return /** @type {Target} */ ({
          productVariant: {
            id: variant.id,
          },
        });
      });
    } else {
      targets = input.cart.lines
        .filter((line) => {
          if (line.merchandise.__typename == "ProductVariant") {
            let hasTags = line.merchandise.product.hasAnyTag;
            return hasTags === true;
          }
        })
        .map((line) => {
          const variant = /** @type {ProductVariant} */ (line.merchandise);
          return /** @type {Target} */ ({
            productVariant: {
              id: variant.id,
            },
          });
        });
    }
  }

  if (configuration.conditional === "AND") {
    targets = input.cart.lines
      .filter((line) => {
        if (line.merchandise.__typename == "ProductVariant") {
          let customertHasTags = true;
          let productHasTags = true;

          input.cart.buyerIdentity?.customer?.hasTags?.forEach((item) => {
            if (!item.hasTag) {
              return (customertHasTags = false);
            }
          });

          line.merchandise?.product?.hasTags?.forEach((item) => {
            if (!item.hasTag) {
              return (productHasTags = false);
            }
          });

          if (customertHasTags && productHasTags) return true;
        }
      })
      .map((line) => {
        const variant = /** @type {ProductVariant} */ (line.merchandise);
        return /** @type {Target} */ ({
          productVariant: {
            id: variant.id,
          },
        });
      });
  }

  if (!targets) {
    console.error("No cart lines qualify for volume discount.");
    return EMPTY_DISCOUNT;
  }

  let value = null;

  if (Object.keys(configuration)[0] === "percentage") {
    value = {
      percentage: {
        value: configuration.percentage.toString(),
      },
    };
  } else {
    value = {
      fixedAmount: {
        amount: configuration.fixedAmount.toString(),
        appliesToEachItem: true,
      },
    };
  }

  return {
    discounts: [
      {
        targets,
        value,
      },
    ],
    discountApplicationStrategy: DiscountApplicationStrategy.First,
  };
}
