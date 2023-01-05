import {createProgramFromSource, inferAllFunctionParams} from "./main"
import {expect, jest, test} from '@jest/globals';
import * as ts from "./TypeScript-fixInferUsage/built/local/typescript"


function functionParamInferenceToString(paramInference: ts.codefix.ParameterInference[], checker: ts.TypeChecker) {
    
    const types = paramInference.map(param => `${param.declaration.getText()}: ${checker.typeToString(param.type)}${param.isOptional === true ? "?" :""}`)
    
    return `${types.join(', ')}`
}




test("assert createProgram not null", () => {
    const sourceText = `
    function f(obj: number) {return obj + 3}
    `
    const [_, typeChecker, source] = createProgramFromSource(sourceText)
    expect(typeChecker === undefined).toBe(false)
    expect(source === undefined).toBe(false)
    expect(source.text === sourceText).toBe(true)
})


test("infer param is number", ()=> {
    const sourceText = `
    function f(obj) {return obj + 3}
    `
    const [program, typeChecker, source] = createProgramFromSource(sourceText)
    const inferences = inferAllFunctionParams(source, program, typeChecker)
    expect(inferences.length).toBe(1)
    expect(functionParamInferenceToString(inferences[0], typeChecker)).toBe("obj: number")

})


test("infer param is anonymous object containing 'x'", () => {
    const sourceText = `
    function f(obj) {return obj.x}
    `
    const [program, typeChecker, source] = createProgramFromSource(sourceText)
    const inferences = inferAllFunctionParams(source, program, typeChecker)
    expect(inferences.length).toBe(1)
    expect(functionParamInferenceToString(inferences[0], typeChecker)).toBe("obj: { x: any; }")
})

test("infer based on call", () => {
    const sourceText = `
    function g(obj: {k}) {}
    function f(obj) {return g(obj)}
    `
    const [program, typeChecker, source] = createProgramFromSource(sourceText)
    const inferences = inferAllFunctionParams(source, program, typeChecker)
    expect(inferences.length).toBe(1)
    expect(functionParamInferenceToString(inferences[0], typeChecker)).toBe("obj: { k: any; }")
})


test("infer TYPE based on call and in function usage", () => {
    const sourceText = `
    function g(obj: {k}) {}
    function f(obj) {g(obj); return obj.q}
    `
    const [program, typeChecker, source] = createProgramFromSource(sourceText)
    const inferences = inferAllFunctionParams(source, program, typeChecker)
    expect(inferences.length).toBe(1)
    expect(functionParamInferenceToString(inferences[0], typeChecker)).toBe("obj: { q: any; k: any; }")
})


test("infer interface type from single call", () => {
    const sourceText = `
    interface K {k}
    function g(obj: K) {}
    function f(obj) {return g(obj)}
    `
    const [program, typeChecker, source] = createProgramFromSource(sourceText)
    const inferences = inferAllFunctionParams(source, program, typeChecker)
    expect(inferences.length).toBe(1)
    expect(functionParamInferenceToString(inferences[0], typeChecker)).toBe("obj: K")
})

test("infer interface type from two calls", () => {
    const sourceText = `
    interface K {k}
    interface G {g}
    function k(obj: K) {}
    function g(obj: G) {}
    function f(obj) {k(obj); return g(obj)}
    `
    const [program, typeChecker, source] = createProgramFromSource(sourceText)
    const inferences = inferAllFunctionParams(source, program, typeChecker)
    expect(inferences.length).toBe(1)
    expect(functionParamInferenceToString(inferences[0], typeChecker)).toBe("obj: K & G")
})

test("infer doesn't overwrite type", () => {
    const sourceText = `
    interface K {k}
    function k(obj: K) {}
    function f(obj) {k(obj); return obj.q}
    `
    const [program, typeChecker, source] = createProgramFromSource(sourceText)
    const inferences = inferAllFunctionParams(source, program, typeChecker)
    expect(inferences.length).toBe(1)
    expect(functionParamInferenceToString(inferences[0], typeChecker)).toBe("obj: K & { q: any; }")
})


/**
 * This is fine here
 */
test("push resolves to array type by default", () => {
    const sourceText = `

    function f(p) {p.push(10)}
    `
    const [program, typeChecker, source] = createProgramFromSource(sourceText)
    const inferences = inferAllFunctionParams(source, program, typeChecker, false)
    expect(inferences.length).toBe(1)
    expect(functionParamInferenceToString(inferences[0], typeChecker)).toBe("p: number[]")
})


test("string methods resolve to string?", () => {
    const sourceText = `

    function foo(text) {
        text.length;
        //text.indexOf("z");
        //text.charAt(0);
    }
    `
    const [program, typeChecker, source] = createProgramFromSource(sourceText)
    const inferences = inferAllFunctionParams(source, program, typeChecker)
    expect(inferences.length).toBe(1)
    expect(functionParamInferenceToString(inferences[0], typeChecker)).toBe("text: string")
})


/**
 * 
 * Putting Typescript test failures here 
 */
/*

function foo([|text |]) {
     text.length;
     text.indexOf("z");
     text.charAt(0);
 }
test("array overrides union", () => {
    const sourceText = `
    class C {
        p;
        method() {
            this.p.push(10);
        }
    }`


})

function f(p: number[]) {
    p.push(10)
}*/
/*
class C {
    p: number[];
    method() {
        this.p.push(10);
    }
}



*/
function f(p: number[]) {
    const a = p.push(10)
}

