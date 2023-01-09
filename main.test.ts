import {createProgramFromSource, inferAllFunctionParams} from "./main"
import {expect, jest, test} from '@jest/globals';
import * as ts from "./TypeScript-fixInferUsage/built/local/typescript"


function functionParamInferenceToString(paramInference: ts.codefix.ParameterInference[], checker: ts.TypeChecker) {
    
    const types = paramInference.sort((a,b) => a.declaration.getText().localeCompare(b.declaration.getText())).map(param => `${param.declaration.getText()}: ${checker.typeToString(param.type)}${param.isOptional === true ? "?" :""}`)
    
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

test("type property call not overwritten ", () => {
    const sourceText = `
    function k(obj: {k: number}) {}
    function f(obj) {k(obj); return obj.k}
    `
    const [program, typeChecker, source] = createProgramFromSource(sourceText)
    const inferences = inferAllFunctionParams(source, program, typeChecker)
    expect(inferences.length).toBe(1)
    expect(functionParamInferenceToString(inferences[0], typeChecker)).toBe("obj: { k: number; }")
})


test("still inferred to be number", () => {
    const sourceText = `
    function k(obj: {k }) {}
    function f(obj) {k(obj); return obj.q > 3}
    `
    const [program, typeChecker, source] = createProgramFromSource(sourceText)
    const inferences = inferAllFunctionParams(source, program, typeChecker)
    expect(inferences.length).toBe(1)
    expect(functionParamInferenceToString(inferences[0], typeChecker))
    .toBe("obj: { q: number; k: any; }")
})







/**
 * This is fine here
 */
test("push resolves to array type by default", () => {
    const sourceText = `

    function f(p) {p.push(10)}
    `
    const [program, typeChecker, source] = createProgramFromSource(sourceText)
    const inferences = inferAllFunctionParams(source, program, typeChecker)
    expect(inferences.length).toBe(1)
    expect(functionParamInferenceToString(inferences[0], typeChecker))
    .toBe("p: { push: (arg0: 10) => void; }")
})


test("Nested Objects", ()=> {
    const sourceText = `

    function f(p) {
        return p.q.a.c > 3
    }
    `
    const [program, typeChecker, source] = createProgramFromSource(sourceText)
    const inferences = inferAllFunctionParams(source, program, typeChecker)
    expect(inferences.length).toBe(1)
    expect(functionParamInferenceToString(inferences[0], typeChecker))
    .toBe("p: { q: { a: { c: number; }; }; }") 
})



test("Nested Objects with call", ()=> {
    const sourceText = `
    function g(p: { q: { a: { g: any; }; }; }) {}
    function f(p) {
        g(p)
        return p.q.a.c > 3
    }
    `
    const [program, typeChecker, source] = createProgramFromSource(sourceText)
    const inferences = inferAllFunctionParams(source, program, typeChecker)
    expect(inferences.length).toBe(1)
    expect(functionParamInferenceToString(inferences[0], typeChecker))
    .toBe("p: { q: { a: { c: number; g: any; }; }; }") 
})


test("Override any", () => {
    const sourceText = `
    function g(p) {}
    function f(p) {
        g(p)
        return p > 3
    }
    `
    const [program, typeChecker, source] = createProgramFromSource(sourceText)
    const inferences = inferAllFunctionParams(source, program, typeChecker)
    expect(inferences.length).toBe(2)
    expect(functionParamInferenceToString(inferences[1], typeChecker))
    .toBe("p: number") 
})

test("Override any 1 deep", () => {
    const sourceText = `
    function g(p: {a}) {}
    function f(p) {
        g(p)
        return p.a > 3
    }
    `
    const [program, typeChecker, source] = createProgramFromSource(sourceText)
    const inferences = inferAllFunctionParams(source, program, typeChecker)
    expect(inferences.length).toBe(1)
    expect(functionParamInferenceToString(inferences[0], typeChecker))
    .toBe("p: { a: number; }") 
})





type K = {
    k
}

type q = K & {k: any; q: any; }
//function f(obj: { q?: any; k?: any; }) {k(obj); return obj.q > 3}


function foo(text) {
    text.length;
    //text.indexOf("z");
    //text.charAt(0);
}

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

function f(p: number[]) {
    const a = p.push(10)
}



*/
